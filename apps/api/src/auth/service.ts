import { hashPassword } from './password.js';
import type { UserRepository } from './repository.js';
import type { Credentials, User } from './schema.js';

export interface AuthService {
  // undefined: an account with this e-mail address already exists.
  register: (credentials: Credentials) => Promise<User | undefined>;
}

export function createAuthService({
  users,
}: {
  users: UserRepository;
}): AuthService {
  return {
    // Hashing first means a taken address costs as much time as a new one.
    register: async ({ email, password }) =>
      await users.create({ email, passwordHash: await hashPassword(password) }),
  };
}
