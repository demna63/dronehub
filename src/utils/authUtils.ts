import type { Comment, User } from '../types';

/** Single source of truth for admin checks (matches Firestore rules). */
export const isUserAdmin = (user: User | null | undefined): boolean => Boolean(user?.isAdmin);

/**
 * May `user` edit or delete `comment`? Mirrors the Firestore rule on
 * `posts/{postId}/comments/{commentId}` exactly — the UI gate and the server
 * gate must never disagree, or the button appears and the write bounces.
 */
export const canManageComment = (
  user: User | null | undefined,
  comment: Pick<Comment, 'authorId'> | null | undefined,
): boolean => {
  if (!user || !comment) return false;
  return user.id === comment.authorId || isUserAdmin(user);
};

export const isDemoAuthEnabled = (): boolean => {
  const flag = import.meta.env.VITE_ENABLE_DEMO_AUTH;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return import.meta.env.DEV;
};
