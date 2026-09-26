import React, { useEffect, useState, useRef } from 'react';
import { User, VlogChatMessage } from '../types';
import { db, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from '../lib/firebase';
import { Send } from 'lucide-react';
import Avatar from './Avatar';
import { MESSAGE_MAX_LENGTH } from '../constants/limits';
import { useToast } from '../contexts/useToast';
import { formatClockTime } from '../utils/dates';
import { useLanguage } from '../contexts/useLanguage';

interface ChatRoomProps {
  user: User | null;
  onLoginClick: () => void;
  channelId: string;
  /** Translated channel name, for the input placeholder. */
  channelName: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ user, onLoginClick, channelId, channelName }) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<VlogChatMessage[]>([]);
  const [listenerError, setListenerError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

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
      setListenerError(t('messages_load_failed'));
    });

    return () => unsubscribe();
  }, [channelId, t]);

  // Keep the newest message in view. Scrolls the list itself: scrollIntoView
  // would also scroll every ancestor, dragging the whole page on a phone.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
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
      showToast(t('message_send_failed'), 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollerRef} className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto bg-bg px-4 py-5 sm:px-6">
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-ink-3">{t('chat_empty')}</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.authorId === user?.id;
            const timeString = formatClockTime(msg.createdAt ?? msg.timestamp) || '';

            return (
              <div key={msg.id} className={`flex items-start gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                <Avatar src={msg.avatar} name={msg.authorName} size={32} />
                <div className={`flex max-w-[80%] flex-col gap-1 sm:max-w-[65%] ${isMine ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-ink-3">
                    <strong className="font-bold text-ink-2">{msg.authorName}</strong>
                    {timeString && <> · <time>{timeString}</time></>}
                  </span>
                  <p
                    className={`whitespace-pre-wrap break-words rounded-[14px] px-3.5 py-2.5 text-sm leading-normal ${
                      isMine ? 'rounded-tr-sm bg-accent-fill text-white' : 'rounded-tl-sm bg-surface-2 text-[#e2e8f0]'
                    }`}
                  >
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {listenerError && (
          <p role="alert" className="rounded-[10px] border border-bad/30 bg-bad/10 px-3 py-2 text-xs font-bold text-bad">
            {listenerError}
          </p>
        )}
      </div>

      <div className="border-t border-line px-4 py-3.5 sm:px-[18px]">
        {user ? (
          <form onSubmit={handleSendMessage} className="flex gap-2.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label={t('message_label')}
              maxLength={MESSAGE_MAX_LENGTH}
              placeholder={t('chat_placeholder', { channel: channelName })}
              disabled={isSending}
              className="h-11 min-w-0 flex-1 rounded-[10px] border border-white/10 bg-bg px-4 text-sm text-ink placeholder:text-ink-3 transition-colors focus:border-accent/50 focus:outline-none"
            />
            <button
              type="submit"
              aria-label={t('chat_send')}
              disabled={!input.trim() || isSending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-accent-fill text-white transition-colors duration-150 hover:bg-accent-fill-hover active:bg-accent-fill-active disabled:opacity-50"
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={onLoginClick}
            className="flex h-11 w-full items-center justify-center rounded-[10px] bg-accent-fill text-sm font-bold text-white transition-colors hover:bg-accent-fill-hover"
          >
            {t('chat_sign_in_to_write')}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;