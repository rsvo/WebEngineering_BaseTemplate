import { requestJson } from '../../api/client';
import { UserSchema, type Credentials, type User } from './types';

export async function register(credentials: Credentials): Promise<User> {
  return await requestJson('/auth/register', UserSchema, {
    method: 'POST',
    body: credentials,
  });
}
