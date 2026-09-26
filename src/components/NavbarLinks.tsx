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

/** Top-bar destination (F2, F7): 40px, accent tint when active, no pill tray. */
export const NavLink: React.FC<NavLinkProps> = ({ to, active, tKey }) => (
  <Link
    to={to}
    aria-current={active ? 'page' : undefined}
    className={`flex h-10 items-center whitespace-nowrap rounded-[10px] px-3.5 text-sm font-bold transition-colors duration-150 ${
      active ? 'bg-accent-tint text-accent' : 'text-ink-2 hover:bg-white/5'
    }`}
  >
    <StableLabel tKey={tKey} />
  </Link>
);

interface MobileNavTileProps {
  to: string;
  onClick: () => void;
  active: boolean;
  tKey: string;
}

/** A 44px tile in the mobile menu's two-column "pages" grid (F16). */
export const MobileNavTile: React.FC<MobileNavTileProps> = ({ to, onClick, active, tKey }) => (
  <Link
    to={to}
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`flex min-h-11 items-center rounded-[10px] px-3 text-[15px] transition-colors duration-150 ${
      active ? 'bg-accent-tint font-bold text-accent' : 'bg-surface text-ink-2 hover:bg-surface-2'
    }`}
  >
    <StableLabel tKey={tKey} align="start" />
  </Link>
);

interface MobileMenuRowProps {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}

/** A full-width 44px row with a bottom rule, for the menu's list groups. */
export const MobileMenuRow: React.FC<MobileMenuRowProps> = ({ to, onClick, children }) => (
  <Link to={to} onClick={onClick} className="flex min-h-11 items-center border-b border-line text-[15px] text-ink-2">
    {children}
  </Link>
);

interface ProfileMenuItemProps {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  tKey: string;
}

export const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({ onClick, icon, tKey }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-ink-2 transition-colors hover:bg-white/5 hover:text-ink"
  >
    {icon} <StableLabel tKey={tKey} align="start" />
  </button>
);
