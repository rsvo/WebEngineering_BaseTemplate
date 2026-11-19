import { randomUUID } from 'node:crypto';
import { groupByBear, type CommentRepository } from './repository.js';
import type { Comment } from './schema.js';

// The Playground 4 store: comments live in the memory of this process only.
// Used by the tests, which then need no database.
export function createInMemoryCommentRepository(): CommentRepository {
  // Map preserves insertion order, i.e. the order of creation.
  const comments = new Map<string, Comment>();
  const all = (): Comment[] => [...comments.values()];

  return {
    listByBear: async (bearId) =>
      all().filter((comment) => comment.bearId === bearId),

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
