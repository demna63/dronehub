import React from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { SIDEBAR_ROW, SIDEBAR_ROW_ACTIVE, SIDEBAR_ROW_IDLE } from '../constants/navigation';

interface NavItemProps {
  to: string;
  label: string;
  icon?: LucideIcon;
  /** Right-aligned trailing content, e.g. a post count. */
  trailing?: React.ReactNode;
  end?: boolean;
}

export const SidebarNavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, trailing, end = false }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `${SIDEBAR_ROW} ${isActive ? SIDEBAR_ROW_ACTIVE : SIDEBAR_ROW_IDLE}`}
  >
    {Icon && <Icon size={18} aria-hidden="true" className="shrink-0" />}
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {trailing}
  </NavLink>
);

interface SidebarNavSectionProps {
  title: string;
  children: React.ReactNode;
}

/** A titled group: 12px/700 ink-3 sentence-case title (F5), 2px row gap. */
const SidebarNavSection: React.FC<SidebarNavSectionProps> = ({ title, children }) => {
  const headingId = React.useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-0.5">
      <h2 id={headingId} className="px-3 pb-1.5 text-xs font-bold text-ink-3">
        {title}
      </h2>
      {children}
    </section>
  );
};

export default SidebarNavSection;
