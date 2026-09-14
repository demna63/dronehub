import React, { useState } from 'react';
import { User } from '../types';
import ChatRoom from './ChatRoom';
import { Hash, Users, Menu, X, Radio, ShoppingBag, HelpCircle, MessageSquare } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';

interface GlobalChatProps {
  currentUser: User | null;
  onLoginClick: () => void;
  onUserClick: (id: string) => void;
}

const CHANNELS = [
  { id: 'general', nameKey: 'chan_general', icon: MessageSquare, descKey: 'chan_general_desc' },
  { id: 'market', nameKey: 'route_market', icon: ShoppingBag, descKey: 'chan_market_desc' },
  { id: 'help', nameKey: 'chan_help', icon: HelpCircle, descKey: 'chan_help_desc' },
  { id: 'racing', nameKey: 'chan_racing', icon: Radio, descKey: 'chan_racing_desc' },
  { id: 'offtopic', nameKey: 'chan_offtopic', icon: Hash, descKey: 'chan_offtopic_desc' }
];

const GlobalChat: React.FC<GlobalChatProps> = ({ currentUser, onLoginClick, onUserClick: _onUserClick }) => {
  const { t } = useLanguage();
  const [activeChannel, setActiveChannel] = useState('general');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // იპოვე აქტიური არხის ობიექტი
  const currentChannelInfo = CHANNELS.find(c => c.id === activeChannel) || CHANNELS[0];

  return (
    <div className="flex h-[calc(100dvh-4rem)] md:h-[calc(100vh-5rem)] bg-slate-950/50 relative overflow-hidden ...">
      
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-950/95 backdrop-blur-xl border-r border-white/10 
        transform transition-transform duration-300 ease-in-out 
        md:relative md:translate-x-0 md:bg-transparent md:border-none md:w-64 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 flex items-center justify-between md:hidden">
           <span className="font-black text-white uppercase tracking-widest flex items-center gap-2">
             <Hash size={18} className="text-sky-500"/> {t('chat_channels')}
           </span>
           <button onClick={() => setIsSidebarOpen(false)}><X size={20} className="text-slate-400"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {CHANNELS.map(channel => {
            const Icon = channel.icon;
            const isActive = activeChannel === channel.id;
            return (
              <button
                key={channel.id}
                onClick={() => { setActiveChannel(channel.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group border ${
                  isActive 
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]' 
                    : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-sky-500' : 'text-slate-400 group-hover:text-white'} />
                <div>
                  <div className="text-sm font-bold">{t(channel.nameKey)}</div>
                  <div className="text-[10px] opacity-60 font-medium">{t(channel.descKey)}</div>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Online Status */}
        <div className="p-4 border-t border-white/5 mx-2 bg-slate-900/50 rounded-xl mb-2">
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE SYSTEM
            </div>
            <p className="text-[10px] text-slate-400 mt-1 pl-4">Connected to DroneHub Relay</p>
        </div>
      </div>

      {/* --- CHAT AREA --- */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-white/5 rounded-3xl overflow-hidden relative shadow-2xl">
        
        {/* Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md z-10">
           <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white">
               <Menu size={20} />
             </button>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/10 text-sky-500">
                  <Hash size={20} />
               </div>
               <div>
                 <h2 className="font-bold text-white text-sm">{t(currentChannelInfo.nameKey)}</h2>
                 <p className="text-[10px] text-slate-400 font-medium">{t(currentChannelInfo.descKey)}</p>
               </div>
             </div>
           </div>
           
           <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
              <Users size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-300">Hub</span>
           </div>
        </div>

        {/* Dynamic Chat Room */}
        <ChatRoom 
          key={activeChannel}
          user={currentUser} 
          onLoginClick={onLoginClick} 
          channelId={activeChannel} 
        />

      </div>
    </div>
  );
};

export default GlobalChat;