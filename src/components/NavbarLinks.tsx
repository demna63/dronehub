import React from 'react';
import { Link } from 'react-router-dom';
import { StableLabel } from './StableLabel';

interface NavLinkProps {
  to: string;
  active: boolean;
  /** Translation key, not a resolved string — the label reserves the width of
   *  its longest translation so the bar does not reflow on a language switch. */
  tKey: string;
}

export const NavLink: React.FC<NavLinkProps> = ({ to, active, tKey }) => (
  <Link to={to} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${active ? 'text-white bg-white/10 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
    <StableLabel tKey={tKey} />
  </Link>
);

interface MobileNavLinkProps {
  to: string;
  onClick: () => void;
  active: boolean;
  tKey: string;
}

export const MobileNavLink: React.FC<MobileNavLinkProps> = ({ to, onClick, active, tKey }) => (
  <Link to={to} onClick={onClick} className={`block px-4 py-4 rounded-2xl text-xl font-black transition-colors ${active ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
    {/* Full-width rows in a vertical menu: nothing shifts sideways, so the text
        is aligned to the start rather than centred. */}
    <StableLabel tKey={tKey} align="start" />
  </Link>
);

interface ProfileMenuItemProps {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  tKey: string;
}

export const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({ onClick, icon, tKey }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors">
    {icon} <StableLabel tKey={tKey} align="start" />
  </button>
);
