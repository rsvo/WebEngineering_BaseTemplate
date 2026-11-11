import { useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { messageFromError } from '../../utils/errors';
import { createComment, deleteComment, fetchComments } from './api';
import type { CommentEntry, NewComment } from './types';

export type CommentsState =
  | { status: 'loading' }
  | { status: 'success'; comments: readonly CommentEntry[] }
  | { status: 'error'; message: string };

interface UseComments {
  state: CommentsState;
  reload: () => void;
  // Both reject with the API's message, so the caller can show it.
  add: (comment: NewComment) => Promise<void>;
  remove: (commentId: string) => Promise<void>;
}

export function useComments(bearId: string): UseComments {
  const [state, setState] = useState<CommentsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    async function load(): Promise<void> {
      try {
        const comments = await fetchComments(bearId, controller.signal);
        if (controller.signal.aborted) return;
        setState({ status: 'success', comments });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: messageFromError(err) });
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [bearId, attempt]);

  function update(
    change: (comments: readonly CommentEntry[]) => readonly CommentEntry[]
  ): void {
    setState((previous) =>
      previous.status === 'success'
        ? { status: 'success', comments: change(previous.comments) }
        : previous
    );
  }

  // The list is only changed once the server confirmed the change, and with
  // the comment the server returned (including its id).
  async function add(comment: NewComment): Promise<void> {
    const created = await createComment(bearId, comment);
    update((comments) => [...comments, created]);
  }

  async function remove(commentId: string): Promise<void> {
    try {
      await deleteComment(commentId);
    } catch (err) {
      // 404: someone else (or an earlier attempt) already deleted it. The goal
      // "this comment is gone" is reached either way.
      if (!(err instanceof ApiError && err.status === 404)) throw err;
    }
    update((comments) => comments.filter((c) => c.id !== commentId));
  }

  return {
    state,
    reload: () => {
      setAttempt((previous) => previous + 1);
    },
    add,
    remove,
  };
}
