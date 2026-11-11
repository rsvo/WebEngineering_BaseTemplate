function hasStringMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

export function messageFromError(err: unknown): string {
  if (hasStringMessage(err)) return err.message;
  return String(err);
}
