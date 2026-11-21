import { z } from 'zod';

export const ROLES = ['user', 'moderator'] as const;
export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

// RFC 5321 caps a forward path at 256 octets, i.e. 254 for the address.
export const EMAIL_MAX_LENGTH = 254;
// NIST SP 800-63B: no composition rules, allow at least 64 characters. The
// task asks for 12 (revision 4 wants 15 if the password is the only factor).
// The upper bound only stops absurdly large inputs.
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 256;

// Strict: a client cannot sneak in `role` or `passwordHash` (mass assignment).
export const CredentialsSchema = z
  .strictObject({
    // Lowercased, so "Ann@x.org" and "ann@x.org" are one account.
    email: z
      .email('must be an e-mail address')
      .max(EMAIL_MAX_LENGTH, `must be at most ${EMAIL_MAX_LENGTH} characters`)
      .toLowerCase(),
    // Not trimmed: every character counts.
    password: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        `must be at least ${PASSWORD_MIN_LENGTH} characters`
      )
      .max(
        PASSWORD_MAX_LENGTH,
        `must be at most ${PASSWORD_MAX_LENGTH} characters`
      ),
  })
  .meta({ id: 'Credentials' });

export type Credentials = z.infer<typeof CredentialsSchema>;

// What the API returns about a user: never the password hash.
export const UserSchema = z
  .object({
    id: z.uuid(),
    email: z.string(),
    role: RoleSchema,
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'User' });

export type User = z.infer<typeof UserSchema>;
