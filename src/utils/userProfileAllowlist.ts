import type { User } from '../types';

const ALLOWED_PROFILE_FIELDS = [
  'name',
  'bio',
  'avatar',
  'location',
  'gear',
  'savedPosts',
  'experienceLevel',
  'droneInterests',
  'socialLinks',
  'droneSetup',
  'favoriteSpot',
  'coverImage',
  'banner',
] as const;

export type AllowedProfileField = (typeof ALLOWED_PROFILE_FIELDS)[number];

export const pickAllowedProfileFields = (data: Partial<User>): Partial<User> => {
  const picked: Partial<User> = {};

  for (const field of ALLOWED_PROFILE_FIELDS) {
    if (field in data && data[field] !== undefined) {
      (picked as Record<string, unknown>)[field] = data[field];
    }
  }

  return picked;
};
