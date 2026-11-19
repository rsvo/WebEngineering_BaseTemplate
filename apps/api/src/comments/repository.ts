import type {
  Comment,
  CommentCursor,
  CommentPageQuery,
  CreateComment,
} from './schema.js';

export interface CommentPage {
  items: Comment[];
  // null: this was the last page.
  nextCursor: CommentCursor | null;
}

export interface CommentRepository {
  // Newest first, `limit` at a time, starting after `cursor`.
  listByBear: (bearId: string, page: CommentPageQuery) => Promise<CommentPage>;
  // One round trip for many bears (avoids N+1); every id gets an entry.
  listByBears: (bearIds: readonly string[]) => Promise<Map<string, Comment[]>>;
  findById: (id: string) => Promise<Comment | undefined>;
  create: (bearId: string, input: CreateComment) => Promise<Comment>;
  // Returns whether a comment was removed.
  delete: (id: string) => Promise<boolean>;
}

// Groups comments by bear, keeping their order and every requested id.
export function groupByBear(
  bearIds: readonly string[],
  comments: readonly Comment[]
): Map<string, Comment[]> {
  const groups = new Map(bearIds.map((id) => [id, [] as Comment[]]));
  for (const comment of comments) groups.get(comment.bearId)?.push(comment);
  return groups;
}

// Implementations fetch one row more than requested: if it exists, there is a
// next page, and it starts after the last row that is returned.
export function toPage(rows: Comment[], limit: number): CommentPage {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      rows.length > limit && last !== undefined
        ? { createdAt: last.createdAt, id: last.id }
        : null,
  };
}
