import { requestJson, requestNoContent } from '../../api/client';
import { UserSchema, type Credentials, type User } from './types';

export async function register(credentials: Credentials): Promise<User> {
  return await requestJson('/auth/register', UserSchema, {
    method: 'POST',
    body: credentials,
  });
}

// The session cookie is HttpOnly: this code never sees it, the browser just
// sends it along with every same-origin request to /api.
export async function login(credentials: Credentials): Promise<User> {
  return await requestJson('/auth/login', UserSchema, {
    method: 'POST',
    body: credentials,
  });
}

export async function logout(): Promise<void> {
  await requestNoContent('/auth/logout', { method: 'POST' });
}

export async function fetchMe(): Promise<User> {
  return await requestJson('/auth/me', UserSchema);
}
