import argon2 from 'argon2';

// OWASP's minimum for argon2id: 19 MiB of memory, 2 passes, 1 lane. The salt
// is random per hash; salt and parameters are stored in the hash string
// ($argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>), so they can be raised later.
const OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, OPTIONS);
}

let dummyHash: Promise<string> | undefined;

// Without a stored hash (unknown e-mail) a dummy is checked anyway, so the
// answer takes as long as for a wrong password and reveals no accounts.
export async function verifyPassword(
  hash: string | undefined,
  password: string
): Promise<boolean> {
  dummyHash ??= hashPassword('no such user, same amount of work');
  const valid = await argon2.verify(hash ?? (await dummyHash), password);
  return hash !== undefined && valid;
}
