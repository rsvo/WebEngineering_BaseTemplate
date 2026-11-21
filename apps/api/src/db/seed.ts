import { readFile } from 'node:fs/promises';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pino } from 'pino';
import { z } from 'zod';
import { hashPassword } from '../auth/password.js';
import { CredentialsSchema } from '../auth/schema.js';
import { BearSchema } from '../bears/schema.js';
import { createBearService } from '../bears/service.js';
import { createWikipediaClient } from '../bears/wikipedia.js';
import { loadConfig } from '../config.js';
import { createPool } from './pool.js';
import { bears, users } from './schema.js';

// Committed snapshot of the BFF's output, used when Wikipedia is unreachable
// so a fresh database can always be seeded.
const FixtureSchema = z.object({
  fetchedAt: z.coerce.date(),
  bears: z.array(BearSchema).min(1),
});
const fixtureUrl = new URL('../../fixtures/bears.json', import.meta.url);

const log = pino({ name: 'db:seed' });
const config = loadConfig();
// One moderator account; its password only ever comes from the environment.
const moderator = z
  .object({
    MODERATOR_EMAIL: CredentialsSchema.shape.email.default(
      'moderator@example.org'
    ),
    MODERATOR_PASSWORD: CredentialsSchema.shape.password.optional(),
  })
  .parse(process.env);

async function loadBears(): Promise<z.infer<typeof FixtureSchema>> {
  try {
    const service = createBearService(
      createWikipediaClient(config.wikipedia),
      log,
      0
    );
    return { fetchedAt: new Date(), bears: [...(await service.list())] };
  } catch (err) {
    log.warn({ err }, 'Wikipedia unavailable, seeding from the fixture');
    return FixtureSchema.parse(JSON.parse(await readFile(fixtureUrl, 'utf8')));
  }
}

const pool = createPool(config.database, log);
try {
  const { fetchedAt, bears: rows } = await loadBears();
  // Upsert: re-running the seed refreshes existing bears instead of failing,
  // and never touches their comments.
  await drizzle(pool)
    .insert(bears)
    .values(rows.map((bear) => ({ ...bear, fetchedAt })))
    .onConflictDoUpdate({
      target: bears.id,
      set: {
        name: sql`excluded.name`,
        binomial: sql`excluded.binomial`,
        imageUrl: sql`excluded.image_url`,
        range: sql`excluded.range`,
        fetchedAt: sql`excluded.fetched_at`,
      },
    });
  log.info({ count: rows.length }, 'bears seeded');

  if (moderator.MODERATOR_PASSWORD === undefined) {
    log.warn('MODERATOR_PASSWORD is not set, no moderator seeded');
  } else {
    const passwordHash = await hashPassword(moderator.MODERATOR_PASSWORD);
    await drizzle(pool)
      .insert(users)
      .values({
        email: moderator.MODERATOR_EMAIL,
        passwordHash,
        role: 'moderator',
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { passwordHash, role: 'moderator' },
      });
    log.info({ email: moderator.MODERATOR_EMAIL }, 'moderator seeded');
  }
} catch (err) {
  log.error(err, 'seeding failed');
  process.exitCode = 1;
} finally {
  await pool.end();
}
