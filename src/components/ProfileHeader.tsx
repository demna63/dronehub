import React from 'react';
import { MapPin, Calendar, Settings } from 'lucide-react';
import type { User } from '../types';

interface ProfileHeaderProps {
  profileUser: User;
  isOwnProfile: boolean;
  onEditProfile: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profileUser, isOwnProfile, onEditProfile }) => {
  return (
    <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden relative shadow-xl">
      <div className="h-40 md:h-52 bg-gradient-to-br from-emerald-600/20 to-sky-600/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent"></div>
      </div>

      <div className="px-6 sm:px-10 pb-8 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20 mb-6">
          <div className="w-32 h-32 rounded-full border-4 border-slate-900 bg-slate-800 relative shadow-2xl overflow-hidden group">
            {profileUser.avatar ? (
              <img src={profileUser.avatar} alt={profileUser.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-600">
                {profileUser.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{profileUser.name}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-emerald-500" /> {profileUser.location || 'Tbilisi, GE'}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-sky-500" /> Joined {profileUser.createdAt ? new Date(profileUser.createdAt).getFullYear() : new Date().getFullYear()}</span>
            </div>
          </div>

          {isOwnProfile && (
            <button
              onClick={onEditProfile}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors flex items-center gap-2"
            >
              <Settings size={16} /> პროფილის რედაქტირება
            </button>
          )}
        </div>

        <p className="text-sm text-slate-300 max-w-2xl leading-relaxed text-center sm:text-left">
          {profileUser.bio || 'პილოტს ჯერ არ დაუმატებია ბიოგრაფია.'}
        </p>
      </div>
    </div>
  );
};

export default ProfileHeader;
