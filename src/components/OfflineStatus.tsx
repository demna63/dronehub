import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/useLanguage';

interface OfflineStatusProps {
  isOffline: boolean;
  hasCachedData: boolean;
}

const OfflineStatus: React.FC<OfflineStatusProps> = ({ isOffline, hasCachedData }) => {
  const { t } = useLanguage();
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
        <p className="font-semibold">{t('offline_title')}</p>
        <p className="text-amber-100/80">
          {hasCachedData ? t('offline_with_cache') : t('offline_no_cache')}
        </p>
      </div>
    </div>
  );
};

export default OfflineStatus;
