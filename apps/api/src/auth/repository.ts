import { randomUUID } from 'node:crypto';
import type { Role, User } from './schema.js';

// A user as stored, including the password hash. Never sent to clients.
export interface UserRecord extends User {
  passwordHash: string;
}

export interface NewUser {
  email: string;
  passwordHash: string;
  role?: Role;
}

export interface NewSession {
  // SHA-256 of the token, never the token itself.
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface UserRepository {
  // undefined: the e-mail address is taken. Decided by the unique constraint,
  // so two concurrent registrations cannot both succeed.
  create: (user: NewUser) => Promise<User | undefined>;
  findByEmail: (email: string) => Promise<UserRecord | undefined>;
  createSession: (session: NewSession) => Promise<void>;
  // undefined: no such session, or it has expired.
  findSessionUser: (sessionId: string) => Promise<User | undefined>;
  deleteSession: (sessionId: string) => Promise<void>;
}

export const toUser = ({ id, email, role, createdAt }: User): User => ({
  id,
  email,
  role,
  createdAt,
});

export function createInMemoryUserRepository(): UserRepository {
  const users = new Map<string, UserRecord>();
  const sessions = new Map<string, NewSession>();
  return {
    create: async ({ email, passwordHash, role = 'user' }) => {
      if (users.has(email)) return undefined;
      const user: UserRecord = {
        id: randomUUID(),
        email,
        passwordHash,
        role,
        createdAt: new Date().toISOString(),
      };
      users.set(email, user);
      return toUser(user);
    },
    findByEmail: async (email) => users.get(email),
    createSession: async (session) => {
      sessions.set(session.id, session);
    },
    findSessionUser: async (sessionId) => {
      const session = sessions.get(sessionId);
      if (session === undefined || session.expiresAt <= new Date()) return;
      const user = [...users.values()].find((u) => u.id === session.userId);
      return user === undefined ? undefined : toUser(user);
    },
    deleteSession: async (sessionId) => {
      sessions.delete(sessionId);
    },
  };
}
