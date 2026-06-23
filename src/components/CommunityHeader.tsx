
import React from 'react';
import { Category } from '../types';
import { motion } from 'framer-motion';
import OptimizedImage from './OptimizedImage';

interface CommunityHeaderProps {
  category: Category | null;
  postsCount: number;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
}

const CommunityHeader: React.FC<CommunityHeaderProps> = ({ category, postsCount, isFollowing, onToggleFollow }) => {
  if (!category) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10 rounded-[48px] overflow-hidden bg-slate-900 border border-white/5 shadow-sm relative group"
    >
      {/* Banner Section */}
      <div className="h-56 md:h-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {category.banner ? (
          <OptimizedImage
            src={category.banner}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000 mix-blend-overlay"
            alt=""
          />
        ) : (
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
      </div>
      
      {/* Community Info Section */}
      <div className="px-8 md:px-12 pb-10 relative">
        <div className="flex flex-col md:flex-row items-end gap-8 -mt-20 relative z-10">
          {/* Large Icon Box */}
          <div className="w-36 h-36 rounded-[44px] bg-slate-800 border-[8px] border-slate-950 flex items-center justify-center text-6xl shadow-xl transition-transform hover:scale-105 duration-500 select-none">
            {category.icon}
          </div>
          
          <div className="flex-1 pb-2 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter typography-mtavruli lowercase">
                {category.slug}
              </h1>
              <span className="px-3.5 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-widest rounded-xl">
                Official Sector
              </span>
            </div>
            
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl leading-relaxed mb-6">
              {category.description}
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span className="text-white">{((category.membersCount ?? 0) / 1000).toFixed(1)}k</span> Pilots
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-400">{category.onlineCount}</span> On Air
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-white font-mono">[{postsCount}]</span> Missions
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 pb-2 w-full md:w-auto">
            <button 
              onClick={onToggleFollow}
              className={`flex-1 md:flex-none px-14 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 border shadow-lg typography-mtavruli ${
                isFollowing 
                  ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white' 
                  : 'bg-white text-slate-950 border-white hover:bg-slate-200'
              }`}
            >
              {isFollowing ? '✓ Joined' : 'Join Sector'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CommunityHeader;
