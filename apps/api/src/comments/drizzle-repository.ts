import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { comments } from '../db/schema.js';
import { groupByBear, toPage, type CommentRepository } from './repository.js';
import type { Comment } from './schema.js';

type CommentRow = typeof comments.$inferSelect;

const toComment = (row: CommentRow): Comment => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

// Newest first. Ties on created_at (same millisecond) are broken by id, so
// the order is total and a cursor never skips or repeats a row.
const newestFirst = [desc(comments.createdAt), desc(comments.id)];

export function createDrizzleCommentRepository(
  db: NodePgDatabase
): CommentRepository {
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
        .where(inArray(comments.bearId, [...bearIds]))
        .orderBy(...newestFirst);
      return groupByBear(bearIds, rows.map(toComment));
    },

    findById: async (id) => {
      const [row] = await db.select().from(comments).where(eq(comments.id, id));
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
  };
}
