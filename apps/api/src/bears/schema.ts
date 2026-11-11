import { z } from 'zod';

// A stable, URL-safe slug of the full binomial name, e.g. "ursus-arctos".
export const BearIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a lowercase slug')
  .max(100)
  .meta({
    description: 'Slug of the binomial name, e.g. "ursus-arctos".',
    example: 'ursus-arctos',
  });

// The normalised bear the API exposes. This is the contract with the frontend,
// independent of how Wikipedia happens to structure its page.
export const BearSchema = z
  .object({
    id: BearIdSchema,
    name: z.string().min(1),
    binomial: z.string().min(1),
    range: z.string().min(1),
    imageUrl: z.url().nullable(),
  })
  .meta({ id: 'Bear' });

export type Bear = z.infer<typeof BearSchema>;

// Readonly, because the service hands out its cached array.
export const BearListSchema = z.array(BearSchema).readonly();
