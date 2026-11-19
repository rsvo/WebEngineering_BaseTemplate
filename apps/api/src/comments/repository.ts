import type { Comment, CreateComment } from './schema.js';

export interface CommentRepository {
  // Oldest first.
  listByBear: (bearId: string) => Promise<Comment[]>;
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
