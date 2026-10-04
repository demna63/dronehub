import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, Bell, Search, LogOut, ChevronDown, ChevronRight, Plus, Settings, UserCircle, ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import { User, Notification } from '../types';
import Logo from './Logo';
import Avatar from './Avatar';
import Modal from './Modal';
import NotificationsDropdown from './NotificationsDropdown';
import { NavLink, MobileNavTile, MobileMenuRow, ProfileMenuItem } from './NavbarLinks';
import { StableLabel } from './StableLabel';
import EcosystemLinksNav from './EcosystemLinksNav';
import { SIDEBAR_CATEGORIES } from '../constants/navigation';
import { isUserAdmin } from '../utils/authUtils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { profileSettingsPath } from '../utils/profileSettings';

interface NavbarProps {
  currentUser?: User | null;
  /** Auth is still restoring the session: render neither signed-in controls nor the sign-in button. */
  authPending?: boolean;
  onSearch?: (query: string) => void;
  onAddPost?: () => void;
  onCreateMarketItem?: () => void;
  onLoginClick?: () => void;
  onProfileClick?: () => void;
  onLogoClick?: () => void;
  notifications?: Notification[];
  onNotificationClick?: (postId: string, id: string) => void;
  onMarkAllAsRead?: () => void;
}

/** Primary action: the one filled button style in the app (F1, F2). */
const PRIMARY_BUTTON =
  'flex h-10 items-center justify-center gap-2 rounded-[10px] bg-accent-fill px-4 text-sm font-bold text-white transition-colors duration-150 hover:bg-accent-fill-hover active:bg-accent-fill-active';

/** Bordered 40px icon/text control used by the language toggle and the bell. */
const OUTLINE_CONTROL =
  'flex h-10 items-center justify-center rounded-[10px] border border-white/[0.08] text-ink-2 transition-colors duration-150 hover:bg-white/5 hover:text-ink';

interface SearchFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  className?: string;
  /** Input height class: 40px in the bar, 44px in the mobile menu. */
  heightClass: string;
}

/**
 * The one search form, rendered in the bar (md+) and in the mobile menu.
 * A form whose only trigger is the Enter key is unusable by touch, hence the
 * explicit submit button.
 */
const SearchField: React.FC<SearchFieldProps> = ({ id, value, onChange, onSubmit, inputRef, className = '', heightClass }) => {
  const { t } = useLanguage();
  return (
    <form role="search" onSubmit={onSubmit} className={`relative ${className}`}>
      <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
      <input
        ref={inputRef}
        type="search"
        name={id}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('search_placeholder')}
        aria-label={t('route_search')}
        className={`w-full ${heightClass} rounded-[10px] border border-white/[0.08] bg-surface pl-10 pr-11 text-sm text-ink placeholder:text-ink-3 transition-colors focus:border-accent/50 focus:outline-none`}
      />
      <button
        type="submit"
        aria-label={t('route_search')}
        disabled={!value.trim()}
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 transition-colors hover:text-accent disabled:cursor-default disabled:hover:text-ink-3"
      >
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </form>
  );
};

/**
 * Top bar (F2, F7, F16).
 *
 * Always opaque on `bg` with a hairline under it: the old transparent-to-blur
 * scroll state changed the bar's legibility with scroll position. On narrow
 * screens every sidebar destination lives in the grouped mobile menu.
 */
const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  authPending = false,
  onSearch,
  onAddPost,
  onCreateMarketItem,
  onLoginClick,
  onProfileClick,
  onLogoClick,
  notifications = [],
  onNotificationClick,
  onMarkAllAsRead,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const { t, language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const profileRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const [menuBox, setMenuBox] = useState<{ top: number; right: number } | null>(null);
  /** Set when the menu is opened from the search icon, so search gets focus. */
  const [focusSearchOnOpen, setFocusSearchOnOpen] = useState(false);

  const placeAccountMenu = useCallback(() => {
    const rect = profileRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuBox({
      top: rect.bottom + 8,
      right: Math.max(16, window.innerWidth - rect.right),
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideAccount = Boolean(
        profileRef.current?.contains(target) || menuRef.current?.contains(target),
      );
      if (!insideAccount) setIsProfileOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // The panel is portaled to the body, so it has to follow the avatar itself.
  useEffect(() => {
    if (!isProfileOpen) return;
    placeAccountMenu();
    window.addEventListener('resize', placeAccountMenu);
    window.addEventListener('scroll', placeAccountMenu, true);
    return () => {
      window.removeEventListener('resize', placeAccountMenu);
      window.removeEventListener('scroll', placeAccountMenu, true);
    };
  }, [isProfileOpen, placeAccountMenu]);

  // A route change from anywhere (back button, a link inside the menu) closes it.
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const closeMenu = () => setIsMobileMenuOpen(false);
  const openMenu = (focusSearch: boolean) => {
    setFocusSearchOnOpen(focusSearch);
    setIsMobileMenuOpen(true);
  };

  /**
   * Hand the query to /search and let that page own everything else.
   * (It used to navigate to `/?q=…`, which nothing read.)
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;

    if (onSearch) {
      onSearch(q);
    } else {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
    closeMenu();
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    closeMenu();
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const path = location.pathname;
  const isActive = (prefix: string) => (prefix === '/' ? path === '/' : path.startsWith(prefix));

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-bg">
        <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4 md:gap-6 md:px-8">
          <Link to="/" onClick={onLogoClick} aria-label={t('nav_home_aria')} className="shrink-0 rounded-[10px]">
            <Logo />
          </Link>

          <nav aria-label={t('landmark_main_nav')} className="hidden items-center gap-1 lg:flex">
            <NavLink to="/" active={isActive('/')} tKey="route_home" />
            <NavLink to="/market" active={isActive('/market')} tKey="route_market" />
            <NavLink to="/vlogs" active={isActive('/vlogs')} tKey="route_vlogs" />
            <NavLink to="/tools" active={isActive('/tools')} tKey="route_tools_short" />
            <NavLink to="/map" active={isActive('/map')} tKey="route_map" />
          </nav>

          <SearchField
            id="search"
            value={searchValue}
            onChange={setSearchValue}
            onSubmit={handleSearch}
            heightClass="h-10"
            className="ml-auto hidden max-w-[400px] flex-1 md:block"
          />

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <button
              type="button"
              aria-label={t('language_aria', { code: language === 'ka' ? 'GE' : 'EN' })}
              onClick={toggleLanguage}
              className={`${OUTLINE_CONTROL} hidden px-3 text-[13px] font-bold sm:flex`}
            >
              {language === 'ka' ? 'GE' : 'EN'}
            </button>

            {authPending ? (
              // Holds the width of the account controls so the bar does not
              // reflow when the session resolves.
              <span aria-hidden="true" className="hidden h-10 w-[136px] sm:block" />
            ) : currentUser ? (
              <>
                <button
                  type="button"
                  onClick={path.startsWith('/market') ? onCreateMarketItem : onAddPost}
                  className={`${PRIMARY_BUTTON} hidden sm:flex`}
                >
                  <Plus size={16} aria-hidden="true" /> <StableLabel tKey="action_add" />
                </button>

                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    aria-label={t('notifications_title')}
                    aria-expanded={showNotifications}
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`${OUTLINE_CONTROL} relative w-10 ${showNotifications ? 'bg-accent-tint text-accent' : ''}`}
                  >
                    <Bell size={18} aria-hidden="true" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-[5px] -top-[5px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-bg bg-bad px-1 text-xs font-extrabold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <NotificationsDropdown
                      notifications={notifications}
                      onNotificationClick={onNotificationClick || (() => {})}
                      onMarkAllAsRead={onMarkAllAsRead || (() => {})}
                      onClose={() => setShowNotifications(false)}
                    />
                  )}
                </div>

                <div className="relative hidden sm:block" ref={profileRef}>
                  <button
                    type="button"
                    aria-label={t('user_menu')}
                    aria-expanded={isProfileOpen}
                    onClick={() => {
                      if (isProfileOpen) {
                        setIsProfileOpen(false);
                        return;
                      }
                      placeAccountMenu();
                      setIsProfileOpen(true);
                    }}
                    className="flex h-10 items-center gap-1.5 rounded-[10px] pr-1.5 transition-colors hover:bg-white/5"
                  >
                    <Avatar src={currentUser.avatar} name={currentUser.name} size={40} className="rounded-[10px]" />
                    <ChevronDown size={14} aria-hidden="true" className={`text-ink-3 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* The header is only h-16. A menu drawn inside it paints over the
                      feed but the rows below the bar can miss the click. The
                      panel is portaled so it sits above the page. */}
                  {isProfileOpen && menuBox && createPortal(
                    <div
                      ref={menuRef}
                      style={{ top: menuBox.top, right: menuBox.right }}
                      className="fixed z-[80] w-56 overflow-hidden rounded-2xl border border-white/10 bg-surface py-1.5 shadow-2xl"
                    >
                      <div className="mb-1 border-b border-line px-4 py-3">
                        <p className="truncate text-sm font-bold text-ink">{currentUser.name}</p>
                        <p className="text-xs text-ink-3">{t('nav_reputation', { count: currentUser.reputation || 0 })}</p>
                      </div>
                      <ProfileMenuItem
                        onClick={() => {
                          onProfileClick?.();
                          navigate(`/u/${currentUser.id}`);
                          setIsProfileOpen(false);
                        }}
                        icon={<UserCircle size={16} aria-hidden="true" />}
                        tKey="nav_profile"
                      />
                      <ProfileMenuItem
                        onClick={() => {
                          navigate(profileSettingsPath(currentUser.id));
                          setIsProfileOpen(false);
                        }}
                        icon={<Settings size={16} aria-hidden="true" />}
                        tKey="nav_settings"
                      />
                      <div className="mx-2 my-1 h-px bg-line" />
                      <button
                        type="button"
                        onClick={() => { void handleLogout(); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-bad transition-colors hover:bg-bad/10"
                      >
                        <LogOut size={16} aria-hidden="true" /> <StableLabel tKey="action_sign_out" align="start" />
                      </button>
                    </div>,
                    document.body,
                  )}
                </div>
              </>
            ) : (
              <button type="button" onClick={onLoginClick} className={`${PRIMARY_BUTTON} hidden sm:flex`}>
                <StableLabel tKey="action_sign_in" />
              </button>
            )}

            <button
              type="button"
              aria-label={t('route_search')}
              onClick={() => openMenu(true)}
              className="flex h-11 w-11 items-center justify-center rounded-[10px] text-ink-2 transition-colors hover:bg-white/5 md:hidden"
            >
              <Search size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={t('mobile_menu')}
              aria-expanded={isMobileMenuOpen}
              onClick={() => openMenu(false)}
              className="flex h-11 w-11 items-center justify-center rounded-[10px] text-ink-2 transition-colors hover:bg-white/5 lg:hidden"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Grouped mobile menu (F16, 3c): every sidebar destination, 44px rows. */}
      <Modal
        isOpen={isMobileMenuOpen}
        onClose={closeMenu}
        title={t('mobile_menu')}
        variant="fullscreen"
        headerStart={<Logo />}
        initialFocusRef={focusSearchOnOpen ? mobileSearchRef : undefined}
      >
        <div className="flex min-h-full flex-col gap-1.5 px-4 pb-5">
          <SearchField
            id="mobile-search"
            value={searchValue}
            onChange={setSearchValue}
            onSubmit={handleSearch}
            inputRef={mobileSearchRef}
            heightClass="h-11"
            className="mb-1.5"
          />

          <h2 className="px-0.5 pb-0.5 pt-1 text-xs font-bold text-ink-3">{t('mobile_group_pages')}</h2>
          <nav aria-label={t('mobile_group_pages')} className="grid grid-cols-2 gap-1.5">
            <MobileNavTile to="/" onClick={closeMenu} active={isActive('/')} tKey="route_home" />
            <MobileNavTile to="/market" onClick={closeMenu} active={isActive('/market')} tKey="route_market" />
            <MobileNavTile to="/vlogs" onClick={closeMenu} active={isActive('/vlogs')} tKey="route_vlogs" />
            <MobileNavTile to="/tools" onClick={closeMenu} active={isActive('/tools')} tKey="route_tools_short" />
            <MobileNavTile to="/map" onClick={closeMenu} active={isActive('/map')} tKey="route_map" />
            {currentUser && (
              <MobileNavTile to="/saved" onClick={closeMenu} active={isActive('/saved')} tKey="route_saved" />
            )}
            {currentUser && (
              <MobileNavTile to={`/u/${currentUser.id}`} onClick={closeMenu} active={isActive(`/u/${currentUser.id}`)} tKey="nav_profile" />
            )}
            {currentUser && (
              <MobileNavTile to={profileSettingsPath(currentUser.id)} onClick={closeMenu} active={false} tKey="nav_settings" />
            )}
          </nav>

          <h2 className="px-0.5 pt-2.5 text-xs font-bold text-ink-3">{t('side_community')}</h2>
          <MobileMenuRow to="/chat" onClick={closeMenu}>{t('side_chat')}</MobileMenuRow>
          <MobileMenuRow to="/meet" onClick={closeMenu}>{t('nav_meet')}</MobileMenuRow>
          <button
            type="button"
            aria-expanded={isCategoriesOpen}
            aria-controls="mobile-menu-categories"
            onClick={() => setIsCategoriesOpen((open) => !open)}
            className="flex min-h-11 items-center justify-between border-b border-line text-left text-[15px] text-ink-2"
          >
            {t('side_categories')}
            <ChevronRight size={16} aria-hidden="true" className={`text-ink-3 transition-transform ${isCategoriesOpen ? 'rotate-90' : ''}`} />
          </button>
          {isCategoriesOpen && (
            <div id="mobile-menu-categories" className="flex flex-col pl-3">
              {SIDEBAR_CATEGORIES.map((category) => (
                <MobileMenuRow key={category.id} to={`/category/${category.id}`} onClick={closeMenu}>
                  {t(category.labelKey)}
                </MobileMenuRow>
              ))}
            </div>
          )}

          <h2 className="px-0.5 pt-2.5 text-xs font-bold text-ink-3">{t('side_info')}</h2>
          <MobileMenuRow to="/regulations" onClick={closeMenu}>{t('nav_regulations')}</MobileMenuRow>
          <EcosystemLinksNav currentSiteId="main" variant="mobile" onNavigate={closeMenu} />
          {isUserAdmin(currentUser ?? null) && (
            <MobileMenuRow to="/admin" onClick={closeMenu}>{t('side_admin_dashboard')}</MobileMenuRow>
          )}

          <div className="mt-auto flex gap-2 pt-4">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={t('language_aria', { code: language === 'ka' ? 'GE' : 'EN' })}
              className="flex h-11 flex-1 items-center justify-center rounded-[10px] border border-white/[0.12] text-sm font-bold text-ink transition-colors hover:bg-white/5"
            >
              GE / EN
            </button>
            {currentUser ? (
              <button
                type="button"
                onClick={() => { void handleLogout(); }}
                className={`${PRIMARY_BUTTON} h-11 flex-[2]`}
              >
                {t('action_sign_out')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { onLoginClick?.(); closeMenu(); }}
                className={`${PRIMARY_BUTTON} h-11 flex-[2]`}
              >
                {t('action_sign_in')}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;
