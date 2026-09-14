
import React from 'react';
import { MeetRoomData, User } from '../types';
import { Video } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';

interface MeetSectionProps {
  rooms: MeetRoomData[];
  user: User | null;
  onOpenRoom: (roomId: string) => void;
  onLoginClick: () => void;
}

const MeetSection: React.FC<MeetSectionProps> = ({ rooms, user, onOpenRoom, onLoginClick }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
      <h1 className="sr-only">{t('meet_title')}</h1>
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 p-10 md:p-14 rounded-[48px] border border-white/10 relative overflow-hidden group shadow-xl">
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-white shadow-lg rotate-3">
                <img src="https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-96dp/logo_meet_2020q4_color_2x_web_96dp.png" alt="Google Meet" className="w-9 h-9" />
             </div>
             <div>
                <p className="text-[11px] font-black text-sky-400 uppercase tracking-[0.5em] mb-1">Live Conference</p>
                <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-white leading-none">Google Meet</h2>
             </div>
          </div>
          <p className="text-slate-400 text-sm font-medium max-w-lg">
            Join the community hangouts. Real-time video/audio conversations for pilots powered by Google Meet.
          </p>
        </div>
      </header>

      {/* Rooms Grid */}
      {rooms.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
          <Video size={40} className="mx-auto text-slate-700 mb-4" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-300">{t('meet_empty')}</p>
          <p className="text-xs text-slate-500 mt-2">{t('meet_empty_hint')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {rooms.map(room => (
          <div 
            key={room.id} 
            onClick={() => user ? onOpenRoom(room.id) : onLoginClick()}
            className="group bg-slate-900 rounded-[40px] overflow-hidden border border-white/5 hover:border-sky-500/30 transition-all duration-500 cursor-pointer shadow-lg relative h-80"
          >
            <div className="absolute inset-0">
               <img src={room.coverImage} className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000 grayscale group-hover:grayscale-0" alt={room.name} />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent"></div>
            </div>

            <div className="absolute inset-0 p-8 flex flex-col justify-end">
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex gap-2">
                       {room.tags.map(tag => (
                         <span key={tag} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                           {tag}
                         </span>
                       ))}
                     </div>
                     <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{room.activeUsers} Active</span>
                     </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{room.name}</h3>
                    <p className="text-slate-400 text-xs mt-1 line-clamp-1">{room.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (user) { onOpenRoom(room.id); } else { onLoginClick(); }
                    }}
                    aria-label={`შეერთება ოთახთან: ${room.name}`}
                    className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    {t('meet_join')}
                  </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetSection;
