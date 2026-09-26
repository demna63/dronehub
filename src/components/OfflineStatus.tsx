import React, { useEffect, useState } from 'react';

interface OfflineStatusProps {
  isOffline: boolean;
  hasCachedData: boolean;
}

const OfflineStatus: React.FC<OfflineStatusProps> = ({ isOffline, hasCachedData }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isOffline) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    const timer = window.setTimeout(() => setIsVisible(false), 5000);
    return () => window.clearTimeout(timer);
  }, [isOffline]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-4 top-20 z-[60] mx-auto flex max-w-xl items-center justify-between rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 shadow-lg">
      <div>
        <p className="font-semibold">You’re offline</p>
        <p className="text-amber-100/80">
          {hasCachedData
            ? 'Showing the latest saved content while the connection is unavailable.'
            : 'The app shell is still available; live updates will resume when connectivity returns.'}
        </p>
      </div>
    </div>
  );
};

export default OfflineStatus;
