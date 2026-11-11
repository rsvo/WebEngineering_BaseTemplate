import { useEffect, useState } from 'react';
import { messageFromError } from '../../utils/errors';
import { fetchBears } from './api';
import type { Bear } from './types';

export type BearsState =
  | { status: 'loading' }
  | { status: 'success'; bears: readonly Bear[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };

interface UseBears {
  state: BearsState;
  reload: () => void;
}

export function useBears(): UseBears {
  const [state, setState] = useState<BearsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      try {
        const bears = await fetchBears(controller.signal);
        if (controller.signal.aborted) return;
        setState(
          bears.length === 0
            ? { status: 'empty' }
            : { status: 'success', bears }
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: messageFromError(err) });
      }
    }

    void load();

    // Runs on unmount and before the next attempt: the request is cancelled
    // and, as a second guard, its result is ignored if it arrives anyway.
    return () => {
      controller.abort();
    };
  }, [attempt]);

  function reload(): void {
    setState({ status: 'loading' });
    setAttempt((previous) => previous + 1);
  }

  return { state, reload };
}
