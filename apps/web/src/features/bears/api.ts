import { getJson } from '../../api/client';
import { BearListSchema, BearSchema, type Bear } from './types';

export async function fetchBears(
  signal: AbortSignal
): Promise<readonly Bear[]> {
  return await getJson('/bears', BearListSchema, signal);
}

export async function fetchBear(
  id: string,
  signal: AbortSignal
): Promise<Bear> {
  return await getJson(`/bears/${encodeURIComponent(id)}`, BearSchema, signal);
}
