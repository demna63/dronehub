import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VlogEntry, User, VlogChatMessage } from '../types';
import { Send, User as UserIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatClockTime } from '../utils/dates';
import { MESSAGE_MAX_LENGTH } from '../constants/limits';
import { useLanguage } from '../contexts/useLanguage';

/** Newest chat messages streamed for a vlog channel. */
const VLOG_CHAT_LIMIT = 100;



interface VlogRoomProps {
  vlogs: VlogEntry[];
  currentUser: User | null;
  onLoginClick: () => void;
}

const VlogRoom: React.FC<VlogRoomProps> = ({ vlogs, currentUser, onLoginClick }) => {
  const { t } = useLanguage();
  const { vlogId } = useParams();
  const navigate = useNavigate();
  
  // ვპოულობთ ვლოგს პროპებიდან (თუ უკვე ჩატვირთულია)
  const [activeVlog, setActiveVlog] = useState<VlogEntry | undefined>(
    vlogs.find(v => v.id === vlogId)
  );
  const [listenerError, setListenerError] = useState<string | null>(null);
  
  // თუ პროპებში არ იყო, ვთვლით რომ იტვირთება
  const [loadingVlog, setLoadingVlog] = useState(!activeVlog);
  
  const [messages, setMessages] = useState<VlogChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. თუ Vlog არ არის პროპებში (მაგ: პირდაპირი ლინკით გახსნისას), წამოვიღოთ ბაზიდან
  useEffect(() => {
    if (activeVlog) {
      setLoadingVlog(false);
      return;
    }
    
    let cancelled = false;

    const fetchVlog = async () => {
      if (!vlogId) return;
      try {
        // Vlogs live in the `vlogs` collection (see firestoreRepository), not in
        // `posts` — so opening /vlogs/<id> from a shared link or refreshing the
        // page always missed and rendered t('vlog_not_found').
        const docRef = doc(db, 'vlogs', vlogId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // აქ ვუთითებთ ტიპს as VlogEntry, რომ TS არ გაბრაზდეს
          if (!cancelled) setActiveVlog({ id: docSnap.id, ...docSnap.data() } as VlogEntry);
        }
      } catch (error) {
        console.error("Vlog fetch error", error);
      } finally {
        if (!cancelled) setLoadingVlog(false);
      }
    };
    fetchVlog();

    return () => { cancelled = true; };
  }, [vlogId, activeVlog]);

  // 2. ჩატის მოსმენა
  useEffect(() => {
    if (!vlogId || !db) return;

    const messagesRef = collection(db, 'channels', vlogId, 'messages');
    // Bounded like ChatRoom (100) and MeetRoom (50); this one streamed a
    // channel's entire history.
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(VLOG_CHAT_LIMIT));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          vlogId: vlogId,
          authorId: data.authorId || data.uid,
          authorName: data.authorName,
          avatar: data.avatar,
          text: data.text,
          timestamp: formatClockTime(data.createdAt),
          createdAt: data.createdAt
        } as VlogChatMessage;
      });
      
      // Queried newest-first for the limit, rendered oldest-first.
      setMessages(msgs.reverse());
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (snapshotError) => {
      // Without this a rules rejection or a dropped connection was silent: the
      // list simply stopped updating with no indication that anything failed.
      console.error('Message listener error:', snapshotError);
      setListenerError(t('messages_load_failed'));
    });

    return () => unsubscribe();
  }, [vlogId, t]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !vlogId) return;

    try {
      setSendError(null);
      const messagesRef = collection(db, 'channels', vlogId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.slice(0, MESSAGE_MAX_LENGTH),
        // `authorId` is what the rule on channels/{id}/messages checks. This
        // wrote `uid`, so every message in a vlog channel was rejected — and
        // the catch below only logged it, so nothing said so.
        authorId: currentUser.id,
        uid: currentUser.id,
        authorName: currentUser.name,
        avatar: currentUser.avatar || '',
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      setSendError(t('message_send_failed'));
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) 
          ? `https://www.youtube.com/embed/${match[2]}?autoplay=1`
          : url;
    } catch (e) {
        return url;
    }
  };

  if (loadingVlog) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <Loader2 className="animate-spin mr-2" /> {t('vlog_loading')}
      </div>
    );
  }

  if (!activeVlog) {
    return <div className="text-center text-white py-20">{t('vlog_not_found')}</div>;
  }

  // ✅ Fix: აქ ვიყენებთ 'url'-ს (რაც VlogEntry-შია) და არა 'videoUrl'-ს
  // ასევე დავამატეთ || '' რომ undefined არ გადაეცეს
  // `addVlog` persists `videoUrl` (and `content`); `url` only ever existed on
  // the in-memory object it returned, so a reloaded vlog rendered <iframe src="">.
  const videoSource = activeVlog.url || activeVlog.videoUrl || activeVlog.content || '';

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] max-w-7xl mx-auto gap-4 p-4">
      {/* VIDEO PLAYER */}
      <div className="flex-1 bg-black rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
         <div className="absolute top-4 left-4 z-10">
           <button onClick={() => navigate('/vlogs')} className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all">
             <ArrowLeft size={20} />
           </button>
         </div>
         <div className="flex-1 relative">
           <iframe 
             src={getEmbedUrl(videoSource)}
             className="absolute inset-0 w-full h-full"
             allowFullScreen
             allow="autoplay; encrypted-media"
             title={activeVlog.title}
           />
         </div>
         <div className="p-4 bg-surface border-t border-white/10">
            <h1 className="text-xl font-bold text-white mb-2">{activeVlog.title}</h1>
            <div className="flex items-center gap-3 text-xs text-ink-3">
               <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg">
                 <UserIcon size={12} /> {activeVlog.author || activeVlog.authorName}
               </div>
               <span>{activeVlog.views || 0} ნახვა</span>
            </div>
         </div>
      </div>

      {/* CHAT SECTION */}
      <div className="w-full lg:w-96 bg-surface border border-white/5 rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-bg/30">
          <h2 className="font-bold text-white text-sm">Live Chat</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.length === 0 ? (
             <div className="text-center text-ink-3 text-xs mt-10">
               {t('chat_be_first')}
             </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-2 overflow-hidden shrink-0 mt-1">
                  {msg.avatar ? <img src={msg.avatar} className="w-full h-full object-cover" alt="av"/> : null}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-ink-2">{msg.authorName}</span>
                    <span className="text-xs text-ink-3">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm text-ink-3 leading-snug break-words">{msg.text}</p>
                </div>
              </div>
            ))
          )}
          {listenerError && (
            <p role="alert" className="my-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-300">
              {listenerError}
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/5 bg-surface">
          {sendError && (
            <p role="alert" className="mb-2 text-xs font-bold text-rose-400">{sendError}</p>
          )}
          {currentUser ? (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('message_placeholder')}
                aria-label={t('message_label')}
                maxLength={MESSAGE_MAX_LENGTH}
                className="flex-1 bg-bg border border-white/10 rounded-[10px] px-4 py-2 text-sm text-white focus:border-accent/50 outline-none"
              />
              <button 
                type="submit" // ✅ გასწორდა: გასუფთავდა \ სიმბოლოებისგან
                disabled={!newMessage.trim()}
                className="p-2 bg-accent-fill text-white rounded-[10px] hover:bg-accent-fill-hover disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          ) : (
            <button 
              onClick={onLoginClick}
              className="w-full py-2 bg-surface-2 text-ink-3 text-xs font-bold rounded-[10px] hover:bg-surface-2 transition-colors"
            >
              {t('chat_join')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VlogRoom;