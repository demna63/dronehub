import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteCommentFromFirestore,
  getCommentsFromFirestore,
  updateCommentInFirestore,
} from '../services/firestoreRepository';
import type { Comment } from '../types';

const EDIT_FAILED = 'კომენტარის შენახვა ვერ მოხერხდა.';
const DELETE_FAILED = 'კომენტარის წაშლა ვერ მოხერხდა.';
const EMPTY_TEXT = 'კომენტარი ცარიელი ვერ იქნება.';

export interface UsePostCommentsResult {
  comments: Comment[];
  loading: boolean;
  /** True once a fetch has settled — the caller may then trust an empty list. */
  hasLoaded: boolean;
  error: string | null;
  /** Id of the comment whose write is in flight, so a row can disable itself. */
  pendingCommentId: string | null;
  editComment: (commentId: string, text: string) => Promise<boolean>;
  removeComment: (commentId: string) => Promise<boolean>;
  refresh: () => void;
  clearError: () => void;
}

/**
 * Loads a post's comments and owns their mutations.
 *
 * Edit and delete are applied optimistically and rolled back to the exact
 * pre-write list if the server rejects them, so a denied rule never leaves a
 * comment visibly deleted.
 */
export const usePostComments = (postId: string | null, enabled: boolean): UsePostCommentsResult => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Rollback needs the list as it stood *before* the optimistic write. Reading
  // it out of state inside the callback would capture a stale render's copy.
  const snapshotRef = useRef<Comment[]>(comments);
  snapshotRef.current = comments;

  useEffect(() => {
    if (!postId || !enabled) {
      setComments([]);
      setHasLoaded(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getCommentsFromFirestore(postId)
      .then((nextComments) => {
        if (cancelled) return;
        setComments(nextComments);
        setHasLoaded(true);
      })
      .catch((loadError) => {
        console.error('Failed to load comments:', loadError);
        if (cancelled) return;
        setComments([]);
        setHasLoaded(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postId, enabled, reloadToken]);

  const mutate = useCallback(async (
    commentId: string,
    optimistic: (list: Comment[]) => Comment[],
    action: (targetPostId: string) => Promise<void>,
    failureMessage: string,
  ): Promise<boolean> => {
    if (!postId || !commentId) return false;

    const snapshot = snapshotRef.current;
    setError(null);
    setPendingCommentId(commentId);
    setComments(optimistic);

    try {
      await action(postId);
      return true;
    } catch (writeError) {
      console.error(failureMessage, writeError);
      setComments(snapshot);
      setError(failureMessage);
      return false;
    } finally {
      setPendingCommentId(null);
    }
  }, [postId]);

  const editComment = useCallback((commentId: string, text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError(EMPTY_TEXT);
      return Promise.resolve(false);
    }

    return mutate(
      commentId,
      (list) => list.map((comment) => (
        comment.id === commentId
          ? { ...comment, text: trimmed, editedAt: new Date().toISOString() }
          : comment
      )),
      (targetPostId) => updateCommentInFirestore(targetPostId, commentId, trimmed),
      EDIT_FAILED,
    );
  }, [mutate]);

  const removeComment = useCallback((commentId: string): Promise<boolean> => mutate(
    commentId,
    (list) => list.filter((comment) => comment.id !== commentId),
    (targetPostId) => deleteCommentFromFirestore(targetPostId, commentId),
    DELETE_FAILED,
  ), [mutate]);

  const refresh = useCallback(() => setReloadToken((token) => token + 1), []);
  const clearError = useCallback(() => setError(null), []);

  return {
    comments,
    loading,
    hasLoaded,
    error,
    pendingCommentId,
    editComment,
    removeComment,
    refresh,
    clearError,
  };
};
