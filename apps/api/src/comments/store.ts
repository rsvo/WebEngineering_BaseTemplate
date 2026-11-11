import { randomUUID } from 'node:crypto';
import type { Comment, CreateComment } from './schema.js';

// Comments live in the memory of this process only: they survive a page
// reload (the browser fetches them again) but not a restart of the API.
export class CommentStore {
  readonly #comments = new Map<string, Comment>();

  listByBear(bearId: string): Comment[] {
    // Map preserves insertion order, i.e. the order of creation.
    return [...this.#comments.values()].filter(
      (comment) => comment.bearId === bearId
    );
  }

  get(id: string): Comment | undefined {
    return this.#comments.get(id);
  }

  create(bearId: string, input: CreateComment): Comment {
    const comment: Comment = {
      id: randomUUID(),
      bearId,
      author: input.author,
      text: input.text,
      createdAt: new Date().toISOString(),
    };
    this.#comments.set(comment.id, comment);
    return comment;
  }

  // Returns whether a comment was removed.
  delete(id: string): boolean {
    return this.#comments.delete(id);
  }
}
