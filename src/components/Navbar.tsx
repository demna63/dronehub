import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Bell, Search, LogOut, 
  ChevronDown, Plus, Globe, Settings, UserCircle 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { User, Notification } from '../types';
import Logo from './Logo';
import NotificationsDropdown from './NotificationsDropdown';
import { NavLink, MobileNavLink, ProfileMenuItem } from './NavbarLinks';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';


interface NavbarProps {
  currentUser?: User | null;
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

const Navbar: React.FC<NavbarProps> = ({
  currentUser,
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const { language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Refs მენიუების გარეთ კლიკის დასაჭერად
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // მენიუების დახურვა გარე კლიკისას
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    if (onSearch) {
      onSearch(q);
    } else {
      navigate(`/?q=${encodeURIComponent(q)}`);
    }
  };

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsProfileOpen(false);
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-[background-color,border-color,box-shadow,padding] duration-500 ease-in-out ${
        isScrolled
          ? 'bg-slate-950/90 border-b border-white/[0.07] py-2 shadow-[0_1px_32px_rgba(2,6,23,0.7)]'
          : 'bg-slate-950/0 border-b border-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-8">
            <Link to="/" onClick={onLogoClick} aria-label="მთავარი გვერდი">
              <Logo />
            </Link>

            <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <NavLink to="/" active={location.pathname === '/'} label="მთავარი" />
              <NavLink to="/market" active={location.pathname.startsWith('/market')} label="მარკეტი" />
              <NavLink to="/vlogs" active={location.pathname.startsWith('/vlogs')} label="ვლოგები" />
              <NavLink to="/tools" active={location.pathname.startsWith('/tools')} label="ხელსაწყოები" />
              <NavLink to="/map" active={location.pathname.startsWith('/map')} label="რუკა" />
            </div>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
            <input
              type="search"
              name="search"
              id="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="ძებნა..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all text-white placeholder:text-slate-400"
            />
          </form>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              aria-label="ენის შეცვლა"
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <Globe size={18} />
              <span className="text-[10px] font-black uppercase">{language === 'ka' ? 'GE' : 'EN'}</span>
            </button>

            {currentUser ? (
              <>
                <button 
                  onClick={location.pathname.startsWith('/market') ? onCreateMarketItem : onAddPost}
                  className="hidden sm:flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-4 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                >
                  <Plus size={18} /> <span className="uppercase tracking-widest text-[11px]">დამატება</span>
                </button>

                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button 
                    aria-label="შეტყობინებები"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2.5 rounded-xl border transition-all relative ${
                      showNotifications ? 'bg-sky-500/10 border-sky-500/50 text-sky-500' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-slate-950">
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

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button 
                    aria-label="მომხმარებლის მენიუ"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 pr-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all"
                  >
                    <img 
                      src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`} 
                      alt={currentUser.name} 
                      loading="lazy"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-lg object-cover bg-slate-800" 
                    />
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 z-[100]">
                      <div className="px-4 py-3 border-b border-slate-800 mb-1">
                        <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium tracking-tight">reputation: {currentUser.reputation || 0}</p>
                      </div>
                      
                      <ProfileMenuItem 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if(onProfileClick) onProfileClick(); 
                          navigate(`/u/${currentUser.id}`);
                          setIsProfileOpen(false); 
                        }} 
                        icon={<UserCircle size={16}/>} 
                        label="პროფილი" 
                      />
                      
                      <ProfileMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/u/${currentUser.id}`);
                          setIsProfileOpen(false);
                        }}
                        icon={<Settings size={16}/>}
                        label="პარამეტრები"
                      />
                      
                      <div className="h-px bg-slate-800 my-1 mx-2"></div>
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-400/10 text-xs font-bold transition-colors"
                      >
                        <LogOut size={16} /> გასვლა
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button 
                onClick={onLoginClick}
                className="px-6 py-2.5 bg-white text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-sky-400 hover:text-white transition-all active:scale-95"
              >
                ავტორიზაცია
              </button>
            )}

            <button aria-label="მობილური მენიუ" onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2.5 bg-white/5 text-slate-400 rounded-xl hover:text-white transition-colors">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950 lg:hidden p-6 animate-in slide-in-from-right duration-300 overflow-y-auto">
          <div className="flex justify-between items-center mb-12">
            <Logo />
            <button aria-label="მენიუს დახურვა" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 bg-white/5 text-slate-400 rounded-xl hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-4">
            <MobileNavLink to="/" onClick={() => setIsMobileMenuOpen(false)} active={location.pathname === '/'} label="მთავარი" />
            <MobileNavLink to="/market" onClick={() => setIsMobileMenuOpen(false)} active={location.pathname.startsWith('/market')} label="მარკეტი" />
            <MobileNavLink to="/vlogs" onClick={() => setIsMobileMenuOpen(false)} active={location.pathname.startsWith('/vlogs')} label="ვლოგები" />
            <MobileNavLink to="/tools" onClick={() => setIsMobileMenuOpen(false)} active={location.pathname.startsWith('/tools')} label="ხელსაწყოები" />
            <MobileNavLink to="/map" active={location.pathname.startsWith('/map')} label="რუკა" onClick={() => setIsMobileMenuOpen(false)} />

            <div className="pt-8 border-t border-white/5 space-y-4">
              <button 
                onClick={() => { toggleLanguage(); setIsMobileMenuOpen(false); }} 
                className="flex items-center justify-between w-full px-4 py-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl text-slate-400 font-bold"
              >
                <span className="flex items-center gap-2 text-lg"><Globe size={24}/> ენა</span>
                <span className="text-sm uppercase font-black text-white">{language === 'ka' ? 'ქართული (GE)' : 'English (EN)'}</span>
              </button>
              
              {!currentUser && (
                <button onClick={() => { if(onLoginClick) onLoginClick(); setIsMobileMenuOpen(false); }} className="w-full py-4 bg-white text-slate-900 hover:bg-sky-400 hover:text-white transition-colors font-black rounded-xl uppercase tracking-widest">
                  ავტორიზაცია
                </button>
              )}

              {currentUser && (
                <button 
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full py-4 bg-rose-500/10 text-rose-400 font-black rounded-xl uppercase tracking-widest"
                >
                  გასვლა
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;