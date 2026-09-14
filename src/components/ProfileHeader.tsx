import React from 'react';
import { BadgeCheck, Calendar, MapPin, Settings, Wrench } from 'lucide-react';
import type { User } from '../types';
import Avatar from './Avatar';
import { formatMonthYear } from '../utils/dates';
import { useLanguage } from '../contexts/useLanguage';

interface ProfileHeaderProps {
  profileUser: User;
  isOwnProfile: boolean;
  onEditProfile: () => void;
  postsCount?: number;
  buildsCount?: number;
}

const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex items-baseline gap-1.5">
    <span className="text-base font-black text-white tabular-nums">{value}</span>
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
  </div>
);

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileUser,
  isOwnProfile,
  onEditProfile,
  postsCount = 0,
  buildsCount = 0,
}) => {
  const { t } = useLanguage();
  // `createdAt` is a Firestore Timestamp, which `new Date(...)` cannot read —
  // that is where the "Joined NaN" came from. Missing dates are now omitted
  // rather than replaced by today's year, which was simply a wrong fact.
  const joined = formatMonthYear(profileUser.createdAt);
  const gear = (profileUser.gear ?? []).filter(Boolean);

  return (
    <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden relative shadow-xl">
      <div className="h-40 md:h-52 bg-gradient-to-br from-emerald-600/20 to-sky-600/20 relative overflow-hidden">
        {profileUser.coverImage && (
          <img
            src={profileUser.coverImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent" />
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
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <span className="truncate">{profileUser.name}</span>
              {profileUser.isVerified && (
                <BadgeCheck size={20} className="text-sky-400 shrink-0" aria-label={t('profile_verified')} />
              )}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 mt-2 text-xs font-bold text-slate-400">
              {profileUser.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-emerald-500" aria-hidden="true" />
                  {profileUser.location}
                </span>
              )}
              {joined && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-sky-500" aria-hidden="true" />
                  შემოუერთდა {joined}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 mt-3">
              <Stat value={postsCount} label={t('profile_stat_posts')} />
              <Stat value={buildsCount} label={t('profile_stat_drones')} />
              <Stat value={profileUser.reputation ?? 0} label={t('profile_stat_reputation')} />
            </div>
          </div>

          {isOwnProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              className="shrink-0 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors flex items-center gap-2"
            >
              <Settings size={16} aria-hidden="true" /> {t('profile_edit')}
            </button>
          )}
        </div>

        <p className="text-sm text-slate-300 max-w-2xl leading-relaxed text-center sm:text-left whitespace-pre-wrap">
          {profileUser.bio || (isOwnProfile
            ? t('profile_bio_empty_own')
            : t('profile_bio_empty_other'))}
        </p>

        {/* `gear` was editable but never rendered anywhere, so anything typed
            there vanished from the person's point of view. */}
        {gear.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Wrench size={14} className="text-slate-500 shrink-0" aria-hidden="true" />
            {gear.map((item) => (
              <span
                key={item}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
