import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { AUTHOR_MAX_LENGTH, TEXT_MAX_LENGTH } from '../comments/schema.js';

// Natural key: the slug of the binomial name is stable, unique and already
// what URLs and the frontend use.
export const bears = pgTable('bears', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  binomial: text('binomial').notNull(),
  imageUrl: text('image_url'),
  range: text('range').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
});

// Surrogate key: a comment has no natural identity.
export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bearId: text('bear_id')
      .notNull()
      .references(() => bears.id, { onDelete: 'cascade' }),
    author: varchar('author', { length: AUTHOR_MAX_LENGTH }).notNull(),
    text: varchar('text', { length: TEXT_MAX_LENGTH }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // Postgres does not index foreign keys by itself. This one serves "comments
  // of a bear, oldest first" and the lookups of ON DELETE CASCADE.
  (table) => [
    index('comments_bear_id_created_at_idx').on(table.bearId, table.createdAt),
  ]
);
