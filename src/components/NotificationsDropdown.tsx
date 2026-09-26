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
    <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 duration-200">
      <div className="px-4 py-3 border-b border-white/10 bg-surface/50 flex justify-between items-center">
        <h3 className="text-sm font-bold text-white">{t('notifications_title')}</h3>
        <button onClick={onClose} className="text-ink-3 hover:text-white transition-colors">
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
                className={`p-4 hover:bg-surface-2/50 cursor-pointer transition-colors relative ${!notification.read ? 'bg-accent-tint' : ''}`}
              >
                {!notification.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-accent-fill rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                )}
                <div className="flex gap-3">
                  <div className="mt-1 shrink-0">
                    {notification.type === 'comment' && <span className="text-lg">💬</span>}
                    {notification.type === 'reply' && <span className="text-lg">↩️</span>}
                    {notification.type === 'vote' && <span className="text-lg">🔋</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink-2 leading-relaxed">
                      <span className="font-bold text-white">{t('notif_actor', { name: notification.senderName })}</span>
                      {notification.type === 'reply' ? t('notif_replied') : 
                       notification.type === 'vote' ? t('notif_rated') : 
                       t('notif_commented')}:
                    </p>
                    <p className="text-xs font-bold text-accent mt-1 line-clamp-1">
                      {notification.postTitle}
                    </p>
                    <p className="text-xs text-ink-3 mt-2 font-medium">
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
            <p className="text-xs text-ink-3 font-medium">{t('notifications_empty')}</p>
          </div>
        )}
      </div>
      
      {notifications.length > 0 && notifications.some(n => !n.read) && (
        <div className="p-3 bg-surface/80 border-t border-white/10 text-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllAsRead();
            }}
            className="text-xs font-bold text-ink-3 hover:text-accent transition-colors"
          >
            {t('notifications_mark_all')}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;