import { useState } from 'react';
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

  const startEdit = (post: Post) => {
    setEditingPostId(post.id);
    setEditContent(post.content || '');
  };

  const cancelEdit = () => setEditingPostId(null);

  const saveEdit = async (post: Post) => {
    if (!editContent.trim() || editContent === post.content) {
      cancelEdit();
      return;
    }
    setIsSaving(true);
    try {
      await apiService.updatePost(post.id, editContent);
      onSuccess?.(post, editContent);
      cancelEdit();
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return { editingPostId, editContent, setEditContent, isSaving, startEdit, cancelEdit, saveEdit };
};
