import { useCallback, useRef, useState } from 'react';
import { apiService } from '../services/apiService';
import { Post } from '../types';

/**
 * Encapsulates the post-editing state and async save logic.
 * Shared between Feed (list view) and PostCard (single-post view).
 *
 * @param onSuccess - called after a successful save with the updated post and new content
 */
export const usePostEdit = (onSuccess?: (post: Post, newContent: string) => void) => {
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * These are handed to React.memo'd children, so their identity has to be
   * stable — an arrow recreated each render makes the shallow compare fail
   * every time and the memo buys nothing but its own comparison cost.
   *
   * `editContent` and `onSuccess` reach saveEdit through refs rather than
   * deps, so typing in the editor does not mint a new saveEdit on every
   * keystroke.
   */
  const editContentRef = useRef(editContent);
  editContentRef.current = editContent;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const startEdit = useCallback((post: Post) => {
    setEditingPostId(post.id);
    setEditContent(post.content || '');
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingPostId(null);
    setSaveError(null);
  }, []);

  const saveEdit = useCallback(async (post: Post) => {
    const content = editContentRef.current;
    if (!content.trim() || content === post.content) {
      setEditingPostId(null);
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await apiService.updatePost(post.id, content);
      onSuccessRef.current?.(post, content);
      setEditingPostId(null);
    } catch (error) {
      console.error('Error updating post:', error);
      // Surfaced as state, not thrown: every call site fires this from an
      // onClick, where a rejected promise would go unhandled. The editor stays
      // open so the text is not lost.
      setSaveError('ცვლილება ვერ შეინახა. სცადე ხელახლა.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { editingPostId, editContent, setEditContent, isSaving, saveError, startEdit, cancelEdit, saveEdit };
};
