import { and, eq, gt, sql } from 'drizzle-orm';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { sessions, users } from '../db/schema.js';
import { toUser, type UserRecord, type UserRepository } from './repository.js';

type Db = PgDatabase<NodePgQueryResultHKT>;

const toRecord = (row: typeof users.$inferSelect): UserRecord => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

export function createDrizzleUserRepository(db: Db): UserRepository {
  return {
    create: async (user) => {
      // Nothing is inserted (and no row returned) if the e-mail is taken.
      const [row] = await db
        .insert(users)
        .values(user)
        .onConflictDoNothing({ target: users.email })
        .returning();
      return row === undefined ? undefined : toUser(toRecord(row));
    },

    findByEmail: async (email) => {
      const [row] = await db.select().from(users).where(eq(users.email, email));
      return row === undefined ? undefined : toRecord(row);
    },

    createSession: async (session) => {
      await db.insert(sessions).values(session);
    },

    findSessionUser: async (sessionId) => {
      const [row] = await db
        .select({ user: users })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(
          and(eq(sessions.id, sessionId), gt(sessions.expiresAt, sql`now()`))
        );
      return row === undefined ? undefined : toUser(toRecord(row.user));
    },

    deleteSession: async (sessionId) => {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    },
  };
}
