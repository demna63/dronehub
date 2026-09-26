import React, { useId, useState } from 'react';
import { User } from '../types';
import ChatRoom from './ChatRoom';
import { useLanguage } from '../contexts/useLanguage';

interface GlobalChatProps {
  currentUser: User | null;
  onLoginClick: () => void;
  onUserClick: (id: string) => void;
}

const CHANNELS = [
  { id: 'general', nameKey: 'chan_general', descKey: 'chan_general_desc' },
  { id: 'market', nameKey: 'route_market', descKey: 'chan_market_desc' },
  { id: 'help', nameKey: 'chan_help', descKey: 'chan_help_desc' },
  { id: 'racing', nameKey: 'chan_racing', descKey: 'chan_racing_desc' },
  { id: 'offtopic', nameKey: 'chan_offtopic', descKey: 'chan_offtopic_desc' },
] as const;

/**
 * Community chat (F6, F8, F20).
 *
 * Channels are tabs in the header rather than a side column, which on a phone
 * was an off-canvas drawer behind a hamburger. The panel fills the centre
 * column's height instead of guessing it with `calc(100vh - 5rem)`.
 */
const GlobalChat: React.FC<GlobalChatProps> = ({ currentUser, onLoginClick }) => {
  const { t } = useLanguage();
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const baseId = useId();

  const current = CHANNELS.find((channel) => channel.id === activeChannel) ?? CHANNELS[0];
  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-panel`;

  /** Arrow keys move between tabs, per the WAI-ARIA tabs pattern. */
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = CHANNELS[(index + step + CHANNELS.length) % CHANNELS.length];
    setActiveChannel(next.id);
    document.getElementById(tabId(next.id))?.focus();
  };

  return (
    <div className="-mx-4 -mb-4 -mt-6 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-surface md:m-0 md:h-full md:rounded-2xl md:border md:border-line">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3.5 sm:px-[18px]">
        <h1 className="text-xl font-extrabold text-ink">{t('side_chat')}</h1>
        <div
          role="tablist"
          aria-label={t('chat_channels')}
          className="scrollbar-none -mx-4 flex min-w-0 basis-full gap-1 overflow-x-auto px-4 text-[13px] sm:mx-0 sm:basis-auto sm:px-0"
        >
          {CHANNELS.map((channel, index) => {
            const isActive = channel.id === activeChannel;
            return (
              <button
                key={channel.id}
                id={tabId(channel.id)}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveChannel(channel.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`h-[34px] shrink-0 whitespace-nowrap rounded-lg px-3 transition-colors duration-150 ${
                  isActive ? 'bg-accent-tint font-bold text-accent' : 'text-ink-2 hover:bg-white/5'
                }`}
              >
                # {t(channel.nameKey)}
              </button>
            );
          })}
        </div>
        <p className="ml-auto hidden text-[13px] text-ink-3 lg:block">{t(current.descKey)}</p>
      </div>

      <div id={panelId} role="tabpanel" aria-labelledby={tabId(current.id)} className="flex min-h-0 flex-1 flex-col">
        <ChatRoom
          key={current.id}
          user={currentUser}
          onLoginClick={onLoginClick}
          channelId={current.id}
          channelName={t(current.nameKey)}
        />
      </div>
    </div>
  );
};

export default GlobalChat;
