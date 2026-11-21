import { z } from 'zod';

// Same rules as the API: length only, no composition rules.
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 256;
export const EMAIL_MAX_LENGTH = 254;

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string(),
  role: z.enum(['user', 'moderator']),
  createdAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export interface Credentials {
  email: string;
  password: string;
}
