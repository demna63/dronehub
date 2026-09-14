import React from 'react';
import { Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';
import { toDate } from '../utils/dates';
import { useLanguage } from '../contexts/useLanguage';

interface NotificationsDropdownProps {
  notifications: Notification[];
  onNotificationClick: (postId: string, notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ 
  notifications, 
  onNotificationClick, 
  onMarkAllAsRead,
  onClose 
}) => {
  const { t } = useLanguage();
  /**
   * date-fns throws a RangeError on an Invalid Date, and this dropdown renders
   * outside the route ErrorBoundary — so one notification whose `createdAt` was
   * neither a Timestamp nor a parseable string white-screened the whole app.
   * `toDate` returns null instead of an Invalid Date.
   */
  const formatTime = (value: unknown): string => {
    const date = toDate(value as Parameters<typeof toDate>[0]);
    if (!date) return '';
    return formatDistanceToNow(date, { addSuffix: true, locale: ka });
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t('notifications_title')}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-800/50">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                onClick={() => onNotificationClick(notification.postId, notification.id)}
                className={`p-4 hover:bg-slate-800/50 cursor-pointer transition-colors relative ${!notification.read ? 'bg-blue-600/5' : ''}`}
              >
                {!notification.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                )}
                <div className="flex gap-3">
                  <div className="mt-1 shrink-0">
                    {notification.type === 'comment' && <span className="text-lg">💬</span>}
                    {notification.type === 'reply' && <span className="text-lg">↩️</span>}
                    {notification.type === 'vote' && <span className="text-lg">🔋</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-white">u/{notification.senderName}</span>-მა 
                      {notification.type === 'reply' ? t('notif_replied') : 
                       notification.type === 'vote' ? t('notif_rated') : 
                       t('notif_commented')}:
                    </p>
                    <p className="text-xs font-bold text-blue-400 mt-1 line-clamp-1">
                      {notification.postTitle}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-xs text-slate-400 font-medium">{t('notifications_empty')}</p>
          </div>
        )}
      </div>
      
      {notifications.length > 0 && notifications.some(n => !n.read) && (
        <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllAsRead();
            }}
            className="text-[10px] font-bold text-slate-400 hover:text-blue-400 uppercase tracking-widest transition-colors"
          >
            {t('notifications_mark_all')}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;