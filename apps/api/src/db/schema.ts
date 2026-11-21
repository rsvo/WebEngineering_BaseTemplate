import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { EMAIL_MAX_LENGTH, ROLES } from '../auth/schema.js';
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
    // null for comments from before accounts existed; only moderators may
    // delete those. A deleted account leaves its comments behind.
    authorId: uuid('author_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    author: varchar('author', { length: AUTHOR_MAX_LENGTH }).notNull(),
    text: varchar('text', { length: TEXT_MAX_LENGTH }).notNull(),
    // Milliseconds, like JavaScript's Date: a pagination cursor built from a
    // Date must compare equal to the stored value (microseconds would not).
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
    reportCount: integer('report_count').notNull().default(0),
    // Set once the comment has enough reports; hidden comments are not listed.
    hiddenAt: timestamp('hidden_at', { withTimezone: true, precision: 3 }),
  },
  // Matches the comments page query exactly: equality on bear_id, then the
  // sort key (created_at, id), read backwards for newest first. Also serves
  // ON DELETE CASCADE, which looks comments up by bear_id (the first column).
  (table) => [
    index('comments_bear_id_created_at_id_idx').on(
      table.bearId,
      table.createdAt,
      table.id
    ),
    index('comments_author_id_idx').on(table.authorId),
  ]
);

export const userRole = pgEnum('user_role', ROLES);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Stored lowercased, so the unique constraint ignores case.
  email: varchar('email', { length: EMAIL_MAX_LENGTH }).notNull().unique(),
  // argon2id in PHC format; the plain password is never stored.
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    // SHA-256 of the cookie's token: a leaked table holds no usable sessions.
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)]
);
