import type { User } from '../types';

/** Single source of truth for admin checks (matches Firestore rules). */
export const isUserAdmin = (user: User | null | undefined): boolean => Boolean(user?.isAdmin);

export const isDemoAuthEnabled = (): boolean => {
  const flag = import.meta.env.VITE_ENABLE_DEMO_AUTH;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return import.meta.env.DEV;
};
