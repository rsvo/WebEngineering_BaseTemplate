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

export interface UserRepository {
  // undefined: the e-mail address is taken. Decided by the unique constraint,
  // so two concurrent registrations cannot both succeed.
  create: (user: NewUser) => Promise<User | undefined>;
  findByEmail: (email: string) => Promise<UserRecord | undefined>;
}

export const toUser = ({ id, email, role, createdAt }: User): User => ({
  id,
  email,
  role,
  createdAt,
});

export function createInMemoryUserRepository(): UserRepository {
  const users = new Map<string, UserRecord>();
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
  };
}
