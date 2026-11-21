import type { FastifyRequest } from 'fastify';
import type { Comment } from '../comments/schema.js';
import { UnauthorizedError } from '../errors.js';
import type { User } from './schema.js';

export function loggedInUser(request: FastifyRequest): User {
  if (request.user === null) {
    throw new UnauthorizedError('Please log in first.');
  }
  return request.user;
}

// Route hook: 401 before anything else, even before the body is validated.
export async function requireLogin(request: FastifyRequest): Promise<void> {
  loggedInUser(request);
}

// The one place that decides who may delete a comment (RBAC + ownership).
export function canDeleteComment(
  user: User,
  comment: Pick<Comment, 'authorId'>
): boolean {
  return user.role === 'moderator' || comment.authorId === user.id;
}
