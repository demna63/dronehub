import React from 'react';
import { Grid, Plane } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';

interface ProfileTabsProps {
  activeTab: 'posts' | 'hangar';
  postsCount: number;
  buildsCount: number;
  onTabChange: (tab: 'posts' | 'hangar') => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, postsCount, buildsCount, onTabChange }) => {
  const { t } = useLanguage();
  const tabClass = (active: boolean) =>
    `pb-4 text-sm font-bold transition-colors flex items-center gap-2 border-b-2 ${active ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-ink-3 hover:text-ink-2'}`;

  return (
    <div className="flex gap-4 border-b border-white/10 px-2">
      <button type="button" onClick={() => onTabChange('posts')} className={tabClass(activeTab === 'posts')}>
        <Grid size={16} aria-hidden="true" /> {t('profile_tab_posts')} ({postsCount})
      </button>
      <button type="button" onClick={() => onTabChange('hangar')} className={tabClass(activeTab === 'hangar')}>
        <Plane size={16} aria-hidden="true" /> {t('profile_tab_hangar')} ({buildsCount})
      </button>
    </div>
  );
};

export default ProfileTabs;
