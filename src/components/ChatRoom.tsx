import React, { useEffect, useState, useRef } from 'react';
import { User, VlogChatMessage } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { db, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from '../lib/firebase';
import { Send, Loader2, Lock, MessageSquare } from 'lucide-react';
import Avatar from './Avatar';
import { MESSAGE_MAX_LENGTH } from '../constants/limits';
import { useToast } from '../contexts/ToastContext';
import { formatClockTime } from '../utils/dates';

interface ChatRoomProps {
  user: User | null;
  onLoginClick: () => void;
  channelId: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ user, onLoginClick, channelId }) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<VlogChatMessage[]>([]);
  const [listenerError, setListenerError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // მესიჯების ჩატვირთვა
  useEffect(() => {
    if (!db) return;
    
    const messagesRef = collection(db, 'chatRooms', channelId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          vlogId: channelId,
          roomId: channelId,
          authorId: data.authorId,
          authorName: data.authorName,
          avatar: data.avatar || data.authorAvatar || '',
          text: data.text,
          timestamp: data.createdAt,
          createdAt: data.createdAt,
        } as VlogChatMessage;
      });
      setMessages(msgs);
    }, (snapshotError) => {
      // Without this a rules rejection or a dropped connection was silent: the
      // list simply stopped updating with no indication that anything failed.
      console.error('Message listener error:', snapshotError);
      setListenerError('შეტყობინებები ვერ ჩაიტვირთა.');
    });

    return () => unsubscribe();
  }, [channelId]);

  // ავტომატური სქროლი
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // მესიჯის გაგზავნა
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || isSending) return;

    setIsSending(true);
    try {
      const messagesRef = collection(db, 'chatRooms', channelId, 'messages');
      await addDoc(messagesRef, {
        text: input.trim(),
        authorId: user.id,
        authorName: user.name,
        avatar: user.avatar || '',
        channelId: channelId,
        createdAt: serverTimestamp(),
      });
      setInput('');
    } catch (error) {
      console.error("Error sending message:", error);
      showToast('შეტყობინება ვერ გაიგზავნა.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F19] relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 opacity-50 pt-20">
              <MessageSquare size={48} className="text-slate-600" />
              <p className="text-sm font-medium">ჯერ არავის არაფერი დაუწერია.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.authorId === user?.id;
              // უსაფრთხოდ ამოგვაქვს დრო
              const timeString = formatClockTime(msg.createdAt ?? msg.timestamp) || '';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex items-end gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <Avatar
                    src={msg.avatar}
                    name={msg.authorName}
                    size={32}
                    ringClassName="border border-white/10"
                  />
                  
                  {/* Message Bubble */}
                  <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-400">{msg.authorName}</span>
                      <span className="text-[9px] text-slate-600 font-mono">
                        {timeString}
                      </span>
                    </div>
                    
                    <div 
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMine 
                          ? 'bg-sky-500 text-white rounded-br-sm' 
                          : 'bg-slate-800 border border-white/5 text-slate-200 rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        {listenerError && (
          <p role="alert" className="my-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] font-bold text-rose-300">
            {listenerError}
          </p>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 relative z-20">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex gap-3">
          
          {/* Login Prompt Overlay */}
          {!user && (
            <div 
              onClick={onLoginClick}
              className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-xl cursor-pointer border border-white/5 hover:bg-slate-900/60 transition-colors"
            >
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-widest">
                <Lock size={14} /> Login to transmit
              </div>
            </div>
          )}
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="შეტყობინება"
            maxLength={MESSAGE_MAX_LENGTH}
            placeholder={`Message #${channelId}...`}
            className="flex-1 bg-slate-900/50 border border-white/10 hover:border-white/20 focus:border-sky-500/50 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all placeholder:text-slate-400"
            disabled={!user || isSending}
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isSending || !user}
            className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:hover:bg-sky-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-95 flex items-center justify-center w-12 shrink-0"
          >
            {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;