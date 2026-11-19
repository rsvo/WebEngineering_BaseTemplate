import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type {
  NodePgDatabase,
  NodePgQueryResultHKT,
} from 'drizzle-orm/node-postgres';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { comments } from '../db/schema.js';
import {
  groupByBear,
  toPage,
  type CommentRepository,
  type Transactor,
} from './repository.js';
import type { Comment } from './schema.js';

// The pool-backed database or a transaction: both run the same queries.
type Db = PgDatabase<NodePgQueryResultHKT>;
type CommentRow = typeof comments.$inferSelect;

const toComment = (row: CommentRow): Comment => ({
  id: row.id,
  bearId: row.bearId,
  author: row.author,
  text: row.text,
  createdAt: row.createdAt.toISOString(),
});

// Newest first. Ties on created_at (same millisecond) are broken by id, so
// the order is total and a cursor never skips or repeats a row.
const newestFirst = [desc(comments.createdAt), desc(comments.id)];
const visible = isNull(comments.hiddenAt);

export function createDrizzleCommentRepository(db: Db): CommentRepository {
  return {
    // Keyset pagination: "rows before the cursor" instead of OFFSET, so the
    // index on (bear_id, created_at, id) jumps straight to the page.
    listByBear: async (bearId, { limit, cursor }) => {
      const rows = await db
        .select()
        .from(comments)
        .where(
          and(
            eq(comments.bearId, bearId),
            visible,
            cursor === undefined
              ? undefined
              : sql`(${comments.createdAt}, ${comments.id}) < (${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)`
          )
        )
        .orderBy(...newestFirst)
        .limit(limit + 1);
      return toPage(rows.map(toComment), limit);
    },

    // One query with `bear_id IN (...)` instead of one query per bear.
    listByBears: async (bearIds) => {
      if (bearIds.length === 0) return new Map();
      const rows = await db
        .select()
        .from(comments)
        .where(and(inArray(comments.bearId, [...bearIds]), visible))
        .orderBy(...newestFirst);
      return groupByBear(bearIds, rows.map(toComment));
    },

    findById: async (id) => {
      const [row] = await db
        .select()
        .from(comments)
        .where(and(eq(comments.id, id), visible));
      return row === undefined ? undefined : toComment(row);
    },

    create: async (bearId, input) => {
      const [row] = await db
        .insert(comments)
        .values({ bearId, author: input.author, text: input.text })
        .returning();
      if (row === undefined) throw new Error('INSERT returned no row');
      return toComment(row);
    },

    delete: async (id) => {
      const deleted = await db
        .delete(comments)
        .where(eq(comments.id, id))
        .returning({ id: comments.id });
      return deleted.length > 0;
    },

    findReportState: async (id, { lock }) => {
      const query = db
        .select({
          reportCount: comments.reportCount,
          hiddenAt: comments.hiddenAt,
        })
        .from(comments)
        .where(eq(comments.id, id));
      const [row] = lock ? await query.for('update') : await query;
      return row === undefined
        ? undefined
        : {
            reportCount: row.reportCount,
            hiddenAt: row.hiddenAt?.toISOString() ?? null,
          };
    },

    saveReportState: async (id, { reportCount, hiddenAt }) => {
      await db
        .update(comments)
        .set({
          reportCount,
          hiddenAt: hiddenAt === null ? null : new Date(hiddenAt),
        })
        .where(eq(comments.id, id));
    },
  };
}

export function createDrizzleTransactor(db: NodePgDatabase): Transactor {
  return async (work) =>
    await db.transaction(
      async (tx) => await work({ comments: createDrizzleCommentRepository(tx) })
    );
}
