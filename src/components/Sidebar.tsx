import React from 'react';
import { Bookmark, MessageSquare, Scale, Shield, UserCircle, Users } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../contexts/useLanguage';
import { isUserAdmin } from '../utils/authUtils';
import { useCategoryCounts } from '../hooks/useCategoryCounts';
import SidebarNavSection, { SidebarNavItem } from './SidebarNavSection';
import EcosystemLinksNav from './EcosystemLinksNav';
import { SIDEBAR_CATEGORIES } from '../constants/navigation';

interface SidebarProps {
  currentUser: User | null;
  /** Auth has not settled yet. */
  authPending?: boolean;
  /** The last visit ended signed in: reserve the "My space" block meanwhile. */
  authHint?: boolean;
}

const CATEGORY_IDS = SIDEBAR_CATEGORIES.map((category) => category.id);

/**
 * Left navigation (F7, F8, F11).
 *
 * Holds only what the top bar does not: the destinations duplicated there
 * (feed, tools, market, map, vlogs) were removed, as were the outer glass
 * panel and a footer that never rendered — App never passed its handlers.
 */
const Sidebar: React.FC<SidebarProps> = ({ currentUser, authPending = false, authHint = false }) => {
  const { t } = useLanguage();
  const counts = useCategoryCounts(CATEGORY_IDS);

  return (
    <nav aria-label={t('landmark_navigation')} className="flex flex-col gap-6">
      {/* Same height as the section below, so categories do not jump when it appears. */}
      {authPending && authHint && <div aria-hidden="true" className="h-[102px]" />}
      {currentUser && (
        <SidebarNavSection title={t('side_my_space')}>
          <SidebarNavItem to="/saved" icon={Bookmark} label={t('route_saved')} />
          <SidebarNavItem to={`/u/${currentUser.id}`} icon={UserCircle} label={t('nav_profile')} />
        </SidebarNavSection>
      )}

      <SidebarNavSection title={t('side_categories')}>
        {SIDEBAR_CATEGORIES.map((category) => (
          <SidebarNavItem
            key={category.id}
            to={`/category/${category.id}`}
            label={t(category.labelKey)}
            trailing={
              counts[category.id] !== undefined ? (
                <span className="text-xs font-normal text-ink-3 tabular-nums">{counts[category.id]}</span>
              ) : undefined
            }
          />
        ))}
      </SidebarNavSection>

      <SidebarNavSection title={t('side_community')}>
        <SidebarNavItem to="/chat" icon={MessageSquare} label={t('side_chat')} />
        <SidebarNavItem to="/meet" icon={Users} label={t('nav_meet')} />
      </SidebarNavSection>

      <SidebarNavSection title={t('side_info')}>
        <SidebarNavItem to="/regulations" icon={Scale} label={t('nav_regulations')} />
      </SidebarNavSection>

      <SidebarNavSection title={t('side_ecosystem')}>
        <EcosystemLinksNav currentSiteId="main" />
      </SidebarNavSection>

      {isUserAdmin(currentUser) && (
        <SidebarNavSection title={t('side_admin')}>
          <SidebarNavItem to="/admin" icon={Shield} label={t('side_admin_dashboard')} />
        </SidebarNavSection>
      )}
    </nav>
  );
};

export default Sidebar;
