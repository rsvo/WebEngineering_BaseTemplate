import { z } from 'zod';

// Brute-force demo: sends ATTEMPTS (default 10) wrong logins one after the
// other and prints each status; after AUTH_RATE_LIMIT_MAX of them the API
// answers 429 with Retry-After.
const env = z
  .object({
    API_URL: z.url().default('http://localhost:3000'),
    ATTEMPTS: z.coerce.number().int().min(1).max(1000).default(10),
  })
  .parse(process.env);
const url = `${env.API_URL.replace(/\/+$/, '')}/api/auth/login`;

for (let attempt = 1; attempt <= env.ATTEMPTS; attempt++) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'moderator@example.org',
      password: `guess-${attempt}`,
    }),
  });
  const retryAfter = response.headers.get('retry-after');
  console.log(
    `#${attempt}: ${response.status}` +
      (retryAfter === null ? '' : ` (Retry-After: ${retryAfter}s)`)
  );
}
