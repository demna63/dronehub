import React, { useState, useEffect, useRef } from 'react';
import { MeetRoomData, User, ChatMessage } from '../types'; // VlogChatMessage -> ChatMessage Alias გამოიყენება
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare } from 'lucide-react';
import { db, collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from '../lib/firebase';
import { MESSAGE_MAX_LENGTH } from '../constants/limits';
import { formatClockTime } from '../utils/dates';
import { useLanguage } from '../contexts/useLanguage';

interface MeetRoomProps {
  room: MeetRoomData;
  user: User | null;
  onLeave: () => void;
  onLoginRequest: () => void;
}

const MeetRoom: React.FC<MeetRoomProps> = ({ room, user, onLeave, onLoginRequest }) => {
  const { t } = useLanguage();
  const [isMicOn, setIsMicOn] = useState(false);
  const [listenerError, setListenerError] = useState<string | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!room.id) return;
    
    // შესწორება: ახალი სინტაქსი
    const q = query(
      collection(db, "global_messages"), 
      where("roomId", "==", room.id),
      orderBy("createdAt", "asc"), 
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          roomId: data.roomId, // შესწორება
          authorId: data.uid,
          authorName: data.authorName,
          avatar: data.avatar,
          text: data.text,
          authorReputation: data.reputation || 0, // შესწორება: Fallback
          timestamp: formatClockTime(data.createdAt) || '...'
        } as ChatMessage;
      });
      setMessages(msgs);
    }, (snapshotError) => {
      // Without this a rules rejection or a dropped connection was silent: the
      // list simply stopped updating with no indication that anything failed.
      console.error('Message listener error:', snapshotError);
      setListenerError(t('messages_load_failed'));
    });
    
    return () => unsubscribe();
  }, [room.id, t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showChat]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onLoginRequest();
      return;
    }
    if (!chatInput.trim()) return;

    try {
      await addDoc(collection(db, "global_messages"), {
        roomId: room.id,
        text: chatInput,
        uid: user.id,
        authorName: user.name,
        avatar: user.avatar,
        reputation: user.reputation, // ინახება ბაზაში
        createdAt: serverTimestamp()
      });
      setChatInput('');
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl overflow-hidden">
             <img src={room.coverImage} className="w-full h-full object-cover" alt="" />
           </div>
           <div>
             <h2 className="text-white font-bold">{room.name}</h2>
             <div className="flex items-center gap-2 text-xs text-emerald-400">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               Live Connection
             </div>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setShowChat(!showChat)} aria-label={t('chat_toggle')} aria-expanded={showChat} className={`p-3 rounded-xl transition-colors ${showChat ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 p-6 flex items-center justify-center bg-slate-950 relative">
           <div className="w-full max-w-4xl aspect-video bg-slate-900 rounded-3xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              {!isVideoOn && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center">
                    {user ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover opacity-50" /> : <VideoOff className="w-10 h-10 text-slate-400" />}
                  </div>
                  <p className="text-slate-400 font-mono text-sm">Camera is off</p>
                </div>
              )}
              {/* Controls Overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                 <button onClick={() => setIsMicOn(!isMicOn)} aria-label={isMicOn ? t('mic_off') : t('mic_on')} className={`p-4 rounded-xl transition-all ${isMicOn ? 'bg-white/10 text-white' : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'}`}>
                   {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                 </button>
                 <button onClick={() => setIsVideoOn(!isVideoOn)} aria-label={isVideoOn ? t('camera_off') : t('camera_on')} className={`p-4 rounded-xl transition-all ${isVideoOn ? 'bg-white/10 text-white' : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'}`}>
                   {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                 </button>
                 <div className="w-px h-8 bg-white/10 mx-2"></div>
                 <button onClick={onLeave} className="px-6 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-2 transition-colors">
                   <PhoneOff className="w-5 h-5" />
                   <span>Leave</span>
                 </button>
              </div>
           </div>
        </div>

        {/* Chat Sidebar */}
        <motion.div 
          initial={false}
          animate={{ width: showChat ? 360 : 0, opacity: showChat ? 1 : 0 }}
          className="bg-slate-900 border-l border-white/10 flex flex-col"
        >
           <div className="p-4 border-b border-white/5">
             <h3 className="text-white font-bold text-sm">Room Chat</h3>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
             {messages.map(msg => (
               <div key={msg.id} className="flex gap-3">
                 <img src={msg.avatar} className="w-8 h-8 rounded-full mt-1" alt="" />
                 <div>
                   <div className="flex items-baseline gap-2">
                     <span className="text-xs font-bold text-slate-300">{msg.authorName}</span>
                     <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                   </div>
                   <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{msg.text}</p>
                 </div>
               </div>
             ))}
             {listenerError && (
               <p role="alert" className="my-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] font-bold text-rose-300">
                 {listenerError}
               </p>
             )}
             <div ref={chatEndRef} />
           </div>

           <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-slate-800/50">
             <input
               type="text"
               name="meet-chat-input"
               id="meet-chat-input"
               value={chatInput}
               onChange={(e) => setChatInput(e.target.value)}
               aria-label={t('message_label')}
               maxLength={MESSAGE_MAX_LENGTH}
               placeholder={user ? "Send a message..." : "Login to chat"}
               disabled={!user}
               className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none"
             />
           </form>
        </motion.div>
      </div>
    </div>
  );
};

export default MeetRoom;