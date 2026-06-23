import React from 'react';
import { Grid, Plane } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: 'posts' | 'hangar';
  postsCount: number;
  buildsCount: number;
  onTabChange: (tab: 'posts' | 'hangar') => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, postsCount, buildsCount, onTabChange }) => {
  return (
    <div className="flex gap-4 border-b border-white/10 px-2">
      <button
        onClick={() => onTabChange('posts')}
        className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'posts' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
      >
        <Grid size={16} /> პოსტები ({postsCount})
      </button>
      <button
        onClick={() => onTabChange('hangar')}
        className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'hangar' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
      >
        <Plane size={16} /> ანგარი ({buildsCount})
      </button>
    </div>
  );
};

export default ProfileTabs;
