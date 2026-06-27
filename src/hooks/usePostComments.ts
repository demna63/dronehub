import { useEffect, useState } from 'react';
import { getCommentsFromFirestore } from '../services/firestoreRepository';
import type { Comment } from '../types';

export const usePostComments = (postId: string | null, enabled: boolean) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId || !enabled) {
      setComments([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getCommentsFromFirestore(postId)
      .then((nextComments) => {
        if (!cancelled) setComments(nextComments);
      })
      .catch((error) => {
        console.error('Failed to load comments:', error);
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postId, enabled]);

  return { comments, loading };
};
