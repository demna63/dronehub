/**
 * Pilot identity fields the profile header and the edit form share.
 * Kept out of the components so those files export components only.
 */

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'experienced', 'pro'] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const isExperienceLevel = (value: string): value is ExperienceLevel =>
  (EXPERIENCE_LEVELS as readonly string[]).includes(value);

export const experienceLevelKey = (level: string): string => `profile_level_${level}`;

export const SOCIAL_FIELDS = [
  { id: 'instagram', labelKey: 'profile_link_instagram' },
  { id: 'youtube', labelKey: 'profile_link_youtube' },
  { id: 'website', labelKey: 'profile_link_website' },
  { id: 'facebook', labelKey: 'profile_link_facebook' },
  { id: 'tiktok', labelKey: 'profile_link_tiktok' },
] as const;

export type SocialFieldId = (typeof SOCIAL_FIELDS)[number]['id'];

export const DRONE_STATUS_KEY: Record<string, string> = {
  flying: 'drone_status_flying',
  wip: 'drone_status_wip',
  broken: 'drone_status_broken',
};
