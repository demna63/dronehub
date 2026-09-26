import React from 'react';
import { useLanguage } from '../contexts/useLanguage';

interface MarketplaceEmptyStateProps {
  activeFilter: string;
  onResetFilter: () => void;
}

const MarketplaceEmptyState: React.FC<MarketplaceEmptyStateProps> = ({ activeFilter, onResetFilter }) => {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-line bg-surface px-6 py-16 text-center">
      <p className="text-sm font-bold text-ink-2">{t('market_empty')}</p>
      {activeFilter !== 'all' && (
        <button
          type="button"
          onClick={onResetFilter}
          className="mt-4 h-10 rounded-[10px] border border-white/10 px-4 text-sm font-bold text-ink-2 transition-colors hover:bg-white/5"
        >
          {t('action_show_all')}
        </button>
      )}
    </div>
  );
};

export default MarketplaceEmptyState;
