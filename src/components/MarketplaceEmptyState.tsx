import React from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';

interface MarketplaceEmptyStateProps {
  activeFilter: string;
  onResetFilter: () => void;
}

const MarketplaceEmptyState: React.FC<MarketplaceEmptyStateProps> = ({ activeFilter, onResetFilter }) => {
  const { t } = useLanguage();
  return (
    <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-slate-900/30">
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search size={32} className="text-slate-400" />
      </div>
      <p className="text-slate-400 font-bold">{t('market_empty')}</p>
      {activeFilter !== 'all' && (
        <button
          onClick={onResetFilter}
          className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all"
        >
          {t('action_show_all')}
        </button>
      )}
    </div>
  );
};

export default MarketplaceEmptyState;
