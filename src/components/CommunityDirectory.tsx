
import React, { useState } from 'react';
import { Category, CategoryGroup } from '../types';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface CommunityDirectoryProps {
  categories: Category[];
  joinedIds: string[];
  onJoinToggle: (id: string) => void;
  onNavigate: (id: string) => void;
}

const CommunityDirectory: React.FC<CommunityDirectoryProps> = ({ 
  categories, 
  joinedIds, 
  onJoinToggle, 
  onNavigate 
}) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('');

  const groups: { id: CategoryGroup; label: string; icon: string; color: string }[] = [
    { id: 'official', label: t('official_channels'), icon: '📢', color: 'text-sky-400' },
    { id: 'community', label: t('communities'), icon: '👥', color: 'text-indigo-400' },
    { id: 'marketplace', label: t('marketplace'), icon: '🛒', color: 'text-emerald-400' },
  ];

  const filteredCategories = categories.filter(c =>
    c.label?.toLowerCase().includes(filter.toLowerCase()) ||
    c.slug?.toLowerCase().includes(filter.toLowerCase()) ||
    c.description.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[40px] p-10 mb-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                <span className="text-4xl">🧭</span> {t('explore_communities')}
              </h1>
              <p className="text-slate-400 font-medium text-sm max-w-xl">
                Discover specialized channels, official news sources, and marketplaces organized for pilots.
              </p>
            </div>
            
            <div className="relative w-full md:w-72 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <input 
                type="text" 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-sky-500/30 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Directory List */}
      <div className="space-y-10">
        {groups.map(group => {
          const groupCats = filteredCategories.filter(c => (c.group || 'community') === group.id);
          if (groupCats.length === 0) return null;

          return (
            <section key={group.id} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <span className={`text-xl ${group.color}`}>{group.icon}</span>
                <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${group.color.replace('text-', 'text-slate-')}`}>{group.label}</h2>
                <div className="h-px bg-white/5 flex-1 ml-4"></div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {groupCats.map(cat => {
                  const isJoined = joinedIds.includes(cat.id);
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={cat.id}
                      onClick={() => onNavigate(cat.id)}
                      className="group bg-slate-900/20 border border-white/5 hover:bg-slate-900/40 hover:border-white/10 rounded-3xl p-5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                          {cat.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-black text-white tracking-tight group-hover:text-sky-400 transition-colors">{cat.slug}</h3>
                            {cat.group === 'official' && <span className="bg-sky-500/10 text-sky-400 text-[9px] font-black px-2 py-0.5 rounded border border-sky-500/20 uppercase tracking-widest">Verified</span>}
                          </div>
                          <p className="text-xs text-slate-400 font-medium line-clamp-1">{cat.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-slate-500 rounded-full"></span> {((cat.membersCount ?? 0) / 1000).toFixed(1)}K members</span>
                            <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span> {cat.onlineCount} online</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); onJoinToggle(cat.id); }}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          isJoined 
                            ? 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20' 
                            : 'bg-sky-500 text-white border-sky-500 hover:bg-sky-400 hover:border-sky-400 shadow-lg shadow-sky-500/20'
                        }`}
                      >
                        {isJoined ? 'Joined' : 'Join'}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
        
        {filteredCategories.length === 0 && (
           <div className="text-center py-20 text-slate-400">
              <p className="text-[10px] font-black uppercase tracking-widest">No communities found matching filters</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDirectory;
