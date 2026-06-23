import React from 'react';
import { Link } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  active: boolean;
  label: string;
}

export const NavLink: React.FC<NavLinkProps> = ({ to, active, label }) => (
  <Link to={to} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${active ? 'text-white bg-white/10 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
    {label}
  </Link>
);

interface MobileNavLinkProps {
  to: string;
  onClick: () => void;
  active: boolean;
  label: string;
}

export const MobileNavLink: React.FC<MobileNavLinkProps> = ({ to, onClick, active, label }) => (
  <Link to={to} onClick={onClick} className={`block px-4 py-4 rounded-2xl text-xl font-black transition-colors ${active ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
    {label}
  </Link>
);

interface ProfileMenuItemProps {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  label: string;
}

export const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({ onClick, icon, label }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors">
    {icon} {label}
  </button>
);
