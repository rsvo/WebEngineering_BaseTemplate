import { asc, eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { comments } from '../db/schema.js';
import { groupByBear, type CommentRepository } from './repository.js';
import type { Comment } from './schema.js';

type CommentRow = typeof comments.$inferSelect;

const toComment = (row: CommentRow): Comment => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

// Ties on created_at (same microsecond) are broken by id, so the order is
// stable across requests.
const oldestFirst = [asc(comments.createdAt), asc(comments.id)];

export function createDrizzleCommentRepository(
  db: NodePgDatabase
): CommentRepository {
  return {
    listByBear: async (bearId) => {
      const rows = await db
        .select()
        .from(comments)
        .where(eq(comments.bearId, bearId))
        .orderBy(...oldestFirst);
      return rows.map(toComment);
    },

    // One query with `bear_id IN (...)` instead of one query per bear.
    listByBears: async (bearIds) => {
      if (bearIds.length === 0) return new Map();
      const rows = await db
        .select()
        .from(comments)
        .where(inArray(comments.bearId, [...bearIds]))
        .orderBy(...oldestFirst);
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
