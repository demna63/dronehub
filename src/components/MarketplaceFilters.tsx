import React from 'react';
import { useLanguage } from '../contexts/useLanguage';

const MARKET_FILTERS = [
  { id: 'all', labelKey: 'filter_all' },
  { id: 'drones', labelKey: 'market_cat_drones' },
  { id: 'parts', labelKey: 'market_cat_parts' },
  { id: 'goggles', labelKey: 'market_cat_goggles' },
  { id: 'radios', labelKey: 'market_cat_radios_short' },
  { id: 'batteries', labelKey: 'market_cat_batteries' },
] as const;

interface MarketplaceFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

/** Horizontal filter chips (F18): 36px, no icons, sentence case. */
const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({ activeFilter, onFilterChange }) => {
  const { t } = useLanguage();
  return (
    <div role="group" aria-label={t('market_filter_label')} className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {MARKET_FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onFilterChange(filter.id)}
            className={`h-9 shrink-0 rounded-[10px] border px-3.5 text-[13px] transition-colors duration-150 ${
              isActive
                ? 'border-accent/30 bg-accent-tint font-bold text-accent'
                : 'border-white/[0.08] text-ink-2 hover:bg-white/5'
            }`}
          >
            {t(filter.labelKey)}
          </button>
        );
      })}
    </div>
  );
};

export default MarketplaceFilters;
