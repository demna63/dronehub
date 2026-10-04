import React from 'react';
import { BadgeCheck, Calendar, MapPin, Settings, Wrench } from 'lucide-react';
import type { User } from '../types';
import Avatar from './Avatar';
import { formatMonthYear } from '../utils/dates';
import { normalizeSocialUrl } from '../utils/socialUrl';
import { useLanguage } from '../contexts/useLanguage';
import { SIDEBAR_CATEGORIES } from '../constants/navigation';
import { SOCIAL_FIELDS, experienceLevelKey, isExperienceLevel } from '../constants/profile';

interface ProfileHeaderProps {
  profileUser: User;
  isOwnProfile: boolean;
  onEditProfile: () => void;
  postsCount?: number;
  buildsCount?: number;
  /** Mean stars across rated posts. Null when nobody has rated any of them. */
  rating?: number | null;
}

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="flex items-baseline gap-1.5">
    <span className="text-base font-extrabold text-white tabular-nums">{value}</span>
    <span className="text-xs font-bold text-ink-3">{label}</span>
  </div>
);

const interestLabel = (id: string, t: (key: string) => string): string => {
  const known = SIDEBAR_CATEGORIES.find((category) => category.id === id);
  return known ? t(known.labelKey) : id;
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileUser,
  isOwnProfile,
  onEditProfile,
  postsCount = 0,
  buildsCount = 0,
  rating = null,
}) => {
  const { t } = useLanguage();
  const joined = formatMonthYear(profileUser.createdAt);
  const gear = (profileUser.gear ?? []).filter(Boolean);
  const level = profileUser.experienceLevel && isExperienceLevel(profileUser.experienceLevel)
    ? t(experienceLevelKey(profileUser.experienceLevel))
    : '';
  const interests = (profileUser.droneInterests ?? []).map((id) => id.trim()).filter(Boolean);
  const links = SOCIAL_FIELDS.flatMap((field) => {
    const href = normalizeSocialUrl(profileUser.socialLinks?.[field.id]);
    return href ? [{ ...field, href }] : [];
  });

  return (
    <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden relative shadow-xl">
      <div className="h-40 md:h-52 bg-surface-2 relative overflow-hidden">
        {profileUser.coverImage ? (
          <img
            src={profileUser.coverImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-surface-2 to-surface" />
        )}
      </div>

      <div className="px-6 sm:px-10 pb-8 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20 mb-6">
          <Avatar
            src={profileUser.avatar}
            name={profileUser.name}
            size={128}
            ringClassName="border-4 border-slate-900 shadow-2xl"
          />

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
              <span className="truncate">{profileUser.name}</span>
              {profileUser.isVerified && (
                <BadgeCheck size={20} className="text-accent shrink-0" aria-label={t('profile_verified')} />
              )}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 mt-2 text-xs font-bold text-ink-3">
              {profileUser.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-emerald-500" aria-hidden="true" />
                  {profileUser.location}
                </span>
              )}
              {level && <span>{level}</span>}
              {joined && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-accent" aria-hidden="true" />
                  {t('profile_joined', { date: joined })}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 mt-3">
              <Stat value={String(postsCount)} label={t('profile_stat_posts')} />
              <Stat value={String(buildsCount)} label={t('profile_stat_drones')} />
              <Stat value={rating == null ? '—' : rating.toFixed(1)} label={t('profile_stat_rating')} />
            </div>
          </div>

          {isOwnProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              className="shrink-0 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-[10px] border border-white/10 transition-colors flex items-center gap-2"
            >
              <Settings size={16} aria-hidden="true" /> {t('profile_edit')}
            </button>
          )}
        </div>

        <p className="text-sm text-ink-2 leading-relaxed text-center sm:text-left whitespace-pre-wrap">
          {profileUser.bio || (isOwnProfile
            ? t('profile_bio_empty_own')
            : t('profile_bio_empty_other'))}
        </p>

        {interests.length > 0 && (
          <ul className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {interests.map((id) => (
              <li
                key={id}
                className="px-2.5 py-1 rounded-lg bg-accent-tint text-xs font-bold text-accent"
              >
                {interestLabel(id, t)}
              </li>
            ))}
          </ul>
        )}

        {gear.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Wrench size={14} className="text-ink-3 shrink-0" aria-hidden="true" />
            {gear.map((item) => (
              <span
                key={item}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-ink-2"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {links.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg border border-white/10 text-xs font-bold text-ink-2 hover:text-white hover:bg-white/5"
              >
                {t(link.labelKey)}
                <span className="sr-only"> {t('link_opens_new_tab')}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
