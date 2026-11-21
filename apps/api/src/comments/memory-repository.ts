import { randomUUID } from 'node:crypto';
import {
  groupByBear,
  toPage,
  type CommentRepository,
  type ReportState,
  type Transactor,
} from './repository.js';
import type { Comment } from './schema.js';

type StoredComment = Comment & ReportState;

// Newest first by (createdAt, id). ISO timestamps compare correctly as strings.
const newestFirst = (a: Comment, b: Comment): number => {
  const byTime = b.createdAt.localeCompare(a.createdAt);
  return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
};

const toComment = ({
  id,
  bearId,
  authorId,
  author,
  text,
  createdAt,
}: Comment): Comment => ({
  id,
  bearId,
  authorId,
  author,
  text,
  createdAt,
});

// The Playground 4 store: comments live in the memory of this process only.
// Used by the tests, which then need no database.
export function createInMemoryCommentRepository(): CommentRepository {
  const comments = new Map<string, StoredComment>();
  const visible = (): StoredComment[] =>
    [...comments.values()]
      .filter((comment) => comment.hiddenAt === null)
      .sort(newestFirst);

  return {
    listByBear: async (bearId, { limit, cursor }) => {
      const rows = visible().filter(
        (comment) =>
          comment.bearId === bearId &&
          (cursor === undefined ||
            newestFirst(comment, { ...comment, ...cursor }) > 0)
      );
      return toPage(rows.slice(0, limit + 1).map(toComment), limit);
    },

    listByBears: async (bearIds) =>
      groupByBear(bearIds, visible().map(toComment)),

    findById: async (id, { includeHidden = false } = {}) => {
      const comment = comments.get(id);
      return comment === undefined ||
        (comment.hiddenAt !== null && !includeHidden)
        ? undefined
        : toComment(comment);
    },

    create: async (bearId, input) => {
      const comment: Comment = {
        id: randomUUID(),
        bearId,
        authorId: input.authorId ?? null,
        author: input.author,
        text: input.text,
        createdAt: new Date().toISOString(),
      };
      comments.set(comment.id, { ...comment, reportCount: 0, hiddenAt: null });
      return comment;
    },

    delete: async (id) => comments.delete(id),

    findReportState: async (id) => {
      const comment = comments.get(id);
      return comment === undefined
        ? undefined
        : { reportCount: comment.reportCount, hiddenAt: comment.hiddenAt };
    },

    saveReportState: async (id, state) => {
      const comment = comments.get(id);
      if (comment !== undefined) comments.set(id, { ...comment, ...state });
    },
  };
}

// No real transactions in memory: work units simply run one after another,
// which is what row locks achieve for the report counter.
export function createInMemoryTransactor(
  repository: CommentRepository
): Transactor {
  let queue: Promise<unknown> = Promise.resolve();
  return async (work) => {
    const result = queue.then(async () => await work({ comments: repository }));
    queue = result.catch(() => undefined);
    return await result;
  };
}
