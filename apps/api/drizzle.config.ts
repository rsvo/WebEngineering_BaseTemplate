import { defineConfig } from 'drizzle-kit';

// Only used to generate migrations (`npm run db:generate`), which needs no
// database. They are applied by src/db/migrate.ts.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
