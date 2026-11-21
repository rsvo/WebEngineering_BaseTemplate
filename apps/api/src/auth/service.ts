import { createHash, randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from './password.js';
import { toUser, type UserRepository } from './repository.js';
import type { Credentials, User } from './schema.js';

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface Session {
  // Goes into the cookie; only its hash is stored.
  token: string;
  user: User;
}

export interface AuthService {
  // undefined: an account with this e-mail address already exists.
  register: (credentials: Credentials) => Promise<User | undefined>;
  // undefined: wrong e-mail or password (deliberately not saying which).
  login: (credentials: Credentials) => Promise<Session | undefined>;
  logout: (token: string) => Promise<void>;
  authenticate: (token: string) => Promise<User | undefined>;
}

const sessionId = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export function createAuthService({
  users,
}: {
  users: UserRepository;
}): AuthService {
  return {
    // Hashing first means a taken address costs as much time as a new one.
    register: async ({ email, password }) =>
      await users.create({ email, passwordHash: await hashPassword(password) }),

    login: async ({ email, password }) => {
      const user = await users.findByEmail(email);
      if (!(await verifyPassword(user?.passwordHash, password))) return;
      if (user === undefined) return;
      // 256 random bits: unguessable, and new on every login (no fixation).
      const token = randomBytes(32).toString('base64url');
      await users.createSession({
        id: sessionId(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
      });
      return { token, user: toUser(user) };
    },

    logout: async (token) => {
      await users.deleteSession(sessionId(token));
    },

    authenticate: async (token) =>
      await users.findSessionUser(sessionId(token)),
  };
}
