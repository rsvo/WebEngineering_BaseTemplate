import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../api/client';
import { messageFromError } from '../../utils/errors';
import { createComment, deleteComment, fetchComments } from './api';
import type { CommentEntry, NewComment } from './types';

export type CommentsState =
  | { status: 'loading' }
  | {
      status: 'success';
      // Newest first, all pages loaded so far.
      comments: readonly CommentEntry[];
      // null: there are no older comments.
      nextCursor: string | null;
    }
  | { status: 'error'; message: string };

interface UseComments {
  state: CommentsState;
  reload: () => void;
  // Appends the next (older) page.
  loadMore: () => void;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  // Both reject with the API's message, so the caller can show it.
  add: (comment: NewComment) => Promise<void>;
  remove: (commentId: string) => Promise<void>;
}

export function useComments(bearId: string): UseComments {
  const [state, setState] = useState<CommentsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  // Aborted when the bear changes, which also cancels a pending loadMore.
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: 'loading' });
    setIsLoadingMore(false);
    setLoadMoreError(null);

    async function load(): Promise<void> {
      try {
        const page = await fetchComments(bearId, null, controller.signal);
        if (controller.signal.aborted) return;
        setState({
          status: 'success',
          comments: page.items,
          nextCursor: page.nextCursor,
        });
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

  async function fetchNextPage(cursor: string): Promise<void> {
    const signal = controllerRef.current?.signal;
    if (signal === undefined) return;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await fetchComments(bearId, cursor, signal);
      if (signal.aborted) return;
      setState((previous) =>
        previous.status === 'success'
          ? {
              status: 'success',
              comments: [...previous.comments, ...page.items],
              nextCursor: page.nextCursor,
            }
          : previous
      );
    } catch (err) {
      if (!signal.aborted) setLoadMoreError(messageFromError(err));
    } finally {
      if (!signal.aborted) setIsLoadingMore(false);
    }
  }

  function update(
    change: (comments: readonly CommentEntry[]) => readonly CommentEntry[]
  ): void {
    setState((previous) =>
      previous.status === 'success'
        ? { ...previous, comments: change(previous.comments) }
        : previous
    );
  }

  // The list is only changed once the server confirmed the change, and with
  // the comment the server returned (including its id). A new comment is the
  // newest, so it goes first; the cursor (older comments) is unaffected.
  async function add(comment: NewComment): Promise<void> {
    const created = await createComment(bearId, comment);
    update((comments) => [created, ...comments]);
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
    loadMore: () => {
      if (
        state.status === 'success' &&
        state.nextCursor !== null &&
        !isLoadingMore
      ) {
        void fetchNextPage(state.nextCursor);
      }
    },
    isLoadingMore,
    loadMoreError,
    add,
    remove,
  };
}
