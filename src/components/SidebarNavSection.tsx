import React from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
}

export const SidebarNavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, end = false }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `
      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
      ${isActive
        ? 'bg-indigo-600/10 text-indigo-400 font-bold'
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 font-medium'}
    `}
  >
    <Icon size={18} className="group-hover:scale-110 transition-transform" />
    <span className="text-sm">{label}</span>
  </NavLink>
);

interface SidebarNavSectionProps {
  title: string;
  titleClassName?: string;
  children: React.ReactNode;
}

const SidebarNavSection: React.FC<SidebarNavSectionProps> = ({ title, titleClassName, children }) => {
  return (
    <div className="space-y-1">
      <div className="px-3 mb-2">
        <h3 className={`text-[10px] font-black uppercase tracking-widest ${titleClassName || 'text-slate-300'}`}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
};

export default SidebarNavSection;
