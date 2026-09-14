import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { VlogEntry, User } from '../types';
import { Play, Clock, Eye, Plus} from 'lucide-react';
import VlogRoom from './VlogRoom';
import AddVlogModal from './AddVlogModal';
import { apiService } from '../services/apiService';
import { useLanguage } from '../contexts/useLanguage';

interface VlogSectionProps {
  vlogs: VlogEntry[];
  user?: User | null;
  currentUser?: User | null; // ✅ დაემატა
  onOpenRoom: (vlogId: string) => void;
  onLoginClick: () => void;
  onAddVlog: (vlog: VlogEntry) => Promise<void>;
  onUpdateVlog: (id: string, data: Partial<VlogEntry>) => void;
  onDeleteVlog: (id: string) => void;
}

const VlogSection: React.FC<VlogSectionProps> = ({ 
  vlogs, user, currentUser, onOpenRoom, onLoginClick, onAddVlog 
}) => {
  const { t } = useLanguage();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const activeUser = user || currentUser; // ვიყენებთ რომელიც არის

  // ვლოგის დამატების ჰენდლერი
  const handleAddVlogSubmit = async (url: string, title: string) => {
    if (!activeUser) return;
    try {
      const newVlog = await apiService.addVlog(url, title, activeUser);
      await onAddVlog(newVlog);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <Routes>
        <Route index element={
          <div className="pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-30 py-4 border-b border-white/5">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span className="text-red-500">LIVE</span> VLOGS
                </h1>
                <p className="text-slate-400 text-xs">{t('vlogs_subtitle')}</p>
              </div>

              <button 
                onClick={() => activeUser ? setIsAddModalOpen(true) : onLoginClick()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">{t('action_add')}</span>
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vlogs.map((vlog) => (
                <button 
                  type="button"
                  key={vlog.id}
                  onClick={() => onOpenRoom(vlog.id)}
                  className="text-left w-full group bg-slate-900 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-red-500/50 transition-all hover:shadow-2xl hover:shadow-red-900/10"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-slate-950 overflow-hidden">
                    <img 
                      src={vlog.thumbnail} 
                      alt={vlog.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play fill="white" className="text-white ml-1" size={20} />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-[10px] font-bold text-white">
                      YouTube
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <span className="block font-bold text-white mb-2 line-clamp-2 group-hover:text-red-400 transition-colors">
                      {vlog.title}
                    </span>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                         <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] text-white font-bold">
                            {(vlog.authorName || 'U')[0]}
                         </div>
                         <span>{vlog.authorName || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Eye size={12} /> {vlog.views}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {t('time_one_day')}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {vlogs.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                {t('vlogs_empty')}
              </div>
            )}
          </div>
        } />
        
        <Route path=":vlogId" element={
            <VlogRoom vlogs={vlogs} currentUser={activeUser ?? null} onLoginClick={onLoginClick} />
        } />
      </Routes>

      <AddVlogModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSubmit={handleAddVlogSubmit} 
      />
    </>
  );
};

export default VlogSection;