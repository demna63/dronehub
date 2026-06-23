import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VlogEntry, User, VlogChatMessage } from '../types';
import { Send, User as UserIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface VlogRoomProps {
  vlogs: VlogEntry[];
  currentUser: User | null;
  onLoginClick: () => void;
}

const VlogRoom: React.FC<VlogRoomProps> = ({ vlogs, currentUser, onLoginClick }) => {
  const { vlogId } = useParams();
  const navigate = useNavigate();
  
  // ვპოულობთ ვლოგს პროპებიდან (თუ უკვე ჩატვირთულია)
  const [activeVlog, setActiveVlog] = useState<VlogEntry | undefined>(
    vlogs.find(v => v.id === vlogId)
  );
  
  // თუ პროპებში არ იყო, ვთვლით რომ იტვირთება
  const [loadingVlog, setLoadingVlog] = useState(!activeVlog);
  
  const [messages, setMessages] = useState<VlogChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. თუ Vlog არ არის პროპებში (მაგ: პირდაპირი ლინკით გახსნისას), წამოვიღოთ ბაზიდან
  useEffect(() => {
    if (activeVlog) {
      setLoadingVlog(false);
      return;
    }
    
    const fetchVlog = async () => {
      if (!vlogId) return;
      try {
        const docRef = doc(db, 'posts', vlogId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // აქ ვუთითებთ ტიპს as VlogEntry, რომ TS არ გაბრაზდეს
          setActiveVlog({ id: docSnap.id, ...docSnap.data() } as VlogEntry);
        }
      } catch (error) {
        console.error("Vlog fetch error", error);
      } finally {
        setLoadingVlog(false);
      }
    };
    fetchVlog();
  }, [vlogId, activeVlog]);

  // 2. ჩატის მოსმენა
  useEffect(() => {
    if (!vlogId || !db) return;

    const messagesRef = collection(db, 'channels', vlogId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          vlogId: vlogId,
          authorId: data.uid,
          authorName: data.authorName,
          avatar: data.avatar,
          text: data.text,
          timestamp: data.createdAt?.toDate 
            ? data.createdAt.toDate().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })
            : '...',
          createdAt: data.createdAt
        } as VlogChatMessage;
      });
      
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [vlogId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !vlogId) return;

    try {
      const messagesRef = collection(db, 'channels', vlogId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        uid: currentUser.id,
        authorName: currentUser.name,
        avatar: currentUser.avatar || '',
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
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
        <Loader2 className="animate-spin mr-2" /> ვლოგი იტვირთება...
      </div>
    );
  }

  if (!activeVlog) {
    return <div className="text-center text-white py-20">ვლოგი ვერ მოიძებნა</div>;
  }

  // ✅ Fix: აქ ვიყენებთ 'url'-ს (რაც VlogEntry-შია) და არა 'videoUrl'-ს
  // ასევე დავამატეთ || '' რომ undefined არ გადაეცეს
  const videoSource = activeVlog.url || ''; 

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] max-w-7xl mx-auto gap-4 p-4">
      {/* VIDEO PLAYER */}
      <div className="flex-1 bg-black rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
         <div className="absolute top-4 left-4 z-10">
           <button onClick={() => navigate('/vlogs')} className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-all">
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
         <div className="p-4 bg-slate-900 border-t border-white/10">
            <h1 className="text-xl font-bold text-white mb-2">{activeVlog.title}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-400">
               <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg">
                 <UserIcon size={12} /> {activeVlog.author || activeVlog.authorName}
               </div>
               <span>{activeVlog.views || 0} ნახვა</span>
            </div>
         </div>
      </div>

      {/* CHAT SECTION */}
      <div className="w-full lg:w-96 bg-slate-900 border border-white/5 rounded-3xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-slate-950/30">
          <h3 className="font-bold text-white text-sm">Live Chat</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.length === 0 ? (
             <div className="text-center text-slate-400 text-xs mt-10">
               იყავი პირველი, ვინც კომენტარს დაწერს!
             </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden shrink-0 mt-1">
                  {msg.avatar ? <img src={msg.avatar} className="w-full h-full object-cover" alt="av"/> : null}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-300">{msg.authorName}</span>
                    <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-snug break-words">{msg.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/5 bg-slate-900">
          {currentUser ? (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="დაწერე..."
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
              />
              <button 
                type="submit" // ✅ გასწორდა: გასუფთავდა \ სიმბოლოებისგან
                disabled={!newMessage.trim()}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          ) : (
            <button 
              onClick={onLoginClick}
              className="w-full py-2 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors"
            >
              შედი ჩატში
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VlogRoom;