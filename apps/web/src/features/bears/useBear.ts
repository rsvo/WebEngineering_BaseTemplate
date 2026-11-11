import { useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { messageFromError } from '../../utils/errors';
import { fetchBear } from './api';
import type { Bear } from './types';

export type BearState =
  | { status: 'loading' }
  | { status: 'success'; bear: Bear }
  | { status: 'not-found' }
  | { status: 'error'; message: string };

interface UseBear {
  state: BearState;
  reload: () => void;
}

// Loads a single bear from GET /api/bears/:id, so a deep link to a detail page
// does not have to download the whole list.
export function useBear(id: string): UseBear {
  const [state, setState] = useState<BearState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    async function load(): Promise<void> {
      try {
        const bear = await fetchBear(id, controller.signal);
        if (controller.signal.aborted) return;
        setState({ status: 'success', bear });
      } catch (err) {
        if (controller.signal.aborted) return;
        // 400 (not a valid id) and 404 (no such bear) both mean "not found"
        // for the user; everything else is a failure worth retrying.
        if (
          err instanceof ApiError &&
          (err.status === 404 || err.status === 400)
        ) {
          setState({ status: 'not-found' });
          return;
        }
        setState({ status: 'error', message: messageFromError(err) });
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [id, attempt]);

  function reload(): void {
    setAttempt((previous) => previous + 1);
  }

  return { state, reload };
}
