import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  MessageSquare, Users, LogIn, LogOut, 
  Gamepad2, Camera, ChevronDown, ChevronRight,
  Zap, Flag, Mountain, Scale, Shield,
  Bookmark, LayoutGrid, MapPin, ShoppingBag, Wifi, Video
} from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../contexts/useLanguage';
import { isUserAdmin } from '../utils/authUtils';
import Logo from './Logo';
import SidebarNavSection, { SidebarNavItem } from './SidebarNavSection';
import EcosystemLinksNav from './EcosystemLinksNav';

interface SidebarProps {
  currentUser: User | null;
  onLoginClick?: () => void;
  onLogout?: () => void;
  onOpenAuth: () => void; // 👈 დაამატეთ ეს ხაზი
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentUser, 
  onLoginClick, 
  onLogout,
  onOpenAuth: _onOpenAuth // 👈 დამატეთ ეს ხაზი
}) => {
  const { t } = useLanguage();
  const location = useLocation();
  
  const [isFpvOpen, setIsFpvOpen] = useState(
    location.pathname.includes('freestyle') || 
    location.pathname.includes('racing') || 
    location.pathname.includes('longrange')
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border-r border-white/5 p-4 rounded-3xl">
      
      {/* ლოგო (მობილურისთვის) */}
      <div className="mb-8 px-2 hidden lg:block xl:hidden"> 
         <Logo /> 
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8">
        
        {/* =========================== */}
        {/* 1. MY SPACE (New) */}
        {/* =========================== */}
        <SidebarNavSection title="MY SPACE">
          <SidebarNavItem to="/" icon={LayoutGrid} label="Feed" end={true} />
          {currentUser && (
            <SidebarNavItem to="/saved" icon={Bookmark} label="შენახულები" />
          )}
        </SidebarNavSection>

        {/* =========================== */}
        {/* 2. EXPLORE */}
        {/* =========================== */}
        <SidebarNavSection title={t('nav_explore') || 'EXPLORE'}>
          <SidebarNavItem to="/tools" icon={Wifi} label={t('nav_tools') || 'FPV Tools'} />
          <SidebarNavItem to="/market" icon={ShoppingBag} label={t('nav_market') || 'Marketplace'} />
          <SidebarNavItem to="/map" icon={MapPin} label={t('nav_map') || 'Map'} />
          <SidebarNavItem to="/vlogs" icon={Video} label={t('nav_vlogs') || 'Vlogs'} />
        </SidebarNavSection>

        {/* =========================== */}
        {/* 3. DRONE ZONES */}
        {/* =========================== */}
        <SidebarNavSection title="DRONE ZONES" titleClassName="text-slate-300 opacity-60">
          <div className="space-y-1">
            <button 
              onClick={() => setIsFpvOpen(!isFpvOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group hover:bg-white/5 ${
                isFpvOpen ? 'text-indigo-400' : 'text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Gamepad2 size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold">FPV Pilots</span>
              </div>
              {isFpvOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {isFpvOpen && (
              <div className="ml-4 pl-3 border-l border-white/10 space-y-1 animate-in slide-in-from-top-2 duration-200">
                <NavLink 
                  to="/category/freestyle" 
                  className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive ? 'text-white bg-white/5' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  <Zap size={14} /> ფრისტაილი
                </NavLink>
                <NavLink 
                  to="/category/racing" 
                  className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive ? 'text-white bg-white/5' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  <Flag size={14} /> რეისინგი
                </NavLink>
                <NavLink 
                  to="/category/longrange" 
                  className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive ? 'text-white bg-white/5' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  <Mountain size={14} /> ლონგ რეინჯი
                </NavLink>
              </div>
            )}
          </div>

          <SidebarNavItem to="/category/cine" icon={Camera} label="Cine Drones" />
        </SidebarNavSection>

        {/* =========================== */}
        {/* 4. INFO & RULES */}
        {/* =========================== */}
        <SidebarNavSection title="ინფორმაცია" titleClassName="text-slate-400">
          <SidebarNavItem to="/regulations" icon={Scale} label="რეგულაციები (Wiki)" />
        </SidebarNavSection>

        {/* =========================== */}
        {/* 5. SOCIAL & LIVE */}
        {/* =========================== */}
        <SidebarNavSection title="SOCIAL & LIVE">
          <SidebarNavItem to="/chat" icon={MessageSquare} label={t('nav_chat') || 'Global Chat'} />
          <SidebarNavItem to="/meet" icon={Users} label={t('nav_meet') || 'Google Meet'} />
        </SidebarNavSection>

        {/* =========================== */}
        {/* 6. DRONEHUB TOOLS (ecosystem) */}
        {/* =========================== */}
        <div className="pt-2 border-t border-white/5">
          <EcosystemLinksNav currentSiteId="main" />
        </div>

        {/* =========================== */}
        {/* 7. ADMIN ZONE */}
        {/* =========================== */}
        {isUserAdmin(currentUser) && (
            <div className="space-y-1 pt-4 border-t border-white/5">
              <SidebarNavSection title="ADMIN ZONE" titleClassName="text-rose-500 flex items-center gap-2">
                <SidebarNavItem to="/admin" icon={Shield} label="Dashboard" />
              </SidebarNavSection>
            </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="mt-auto pt-6 border-t border-white/5">
        {currentUser ? (
          onLogout && (
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">{t('nav_logout') || 'Logout'}</span>
            </button>
          )
        ) : (
          onLoginClick && (
            <button 
              onClick={onLoginClick}
              className="flex items-center justify-center gap-2 px-4 py-2.5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <LogIn size={16} />
              <span>{t('login_btn') || 'Login'}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;