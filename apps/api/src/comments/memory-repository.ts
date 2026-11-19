import { randomUUID } from 'node:crypto';
import { groupByBear, toPage, type CommentRepository } from './repository.js';
import type { Comment } from './schema.js';

// Newest first by (createdAt, id). ISO timestamps compare correctly as strings.
const newestFirst = (a: Comment, b: Comment): number => {
  const byTime = b.createdAt.localeCompare(a.createdAt);
  return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
};

// The Playground 4 store: comments live in the memory of this process only.
// Used by the tests, which then need no database.
export function createInMemoryCommentRepository(): CommentRepository {
  const comments = new Map<string, Comment>();
  const all = (): Comment[] => [...comments.values()].sort(newestFirst);

  return {
    listByBear: async (bearId, { limit, cursor }) => {
      const rows = all().filter(
        (comment) =>
          comment.bearId === bearId &&
          (cursor === undefined ||
            newestFirst(comment, { ...comment, ...cursor }) > 0)
      );
      return toPage(rows.slice(0, limit + 1), limit);
    },

    listByBears: async (bearIds) => groupByBear(bearIds, all()),

    findById: async (id) => comments.get(id),

    create: async (bearId, input) => {
      const comment: Comment = {
        id: randomUUID(),
        bearId,
        author: input.author,
        text: input.text,
        createdAt: new Date().toISOString(),
      };
      comments.set(comment.id, comment);
      return comment;
    },

    delete: async (id) => comments.delete(id),
  };
}
