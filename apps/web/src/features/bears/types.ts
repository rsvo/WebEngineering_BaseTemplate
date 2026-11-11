import { z } from 'zod';

// Mirrors the API's contract for a bear. The response is validated again here
// because the browser cannot trust that it really came from our API in this
// exact shape (proxies, version skew between deployed frontend and backend).
export const BearSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  binomial: z.string().min(1),
  range: z.string(),
  imageUrl: z.string().nullable(),
});

export type Bear = z.infer<typeof BearSchema>;

export const BearListSchema = z.array(BearSchema).readonly();
