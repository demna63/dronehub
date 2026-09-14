import React from 'react';
import { LayoutGrid, Plane, Cpu, Glasses, Radio, Battery } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';

const MARKET_FILTERS = [
  { id: 'all', labelKey: 'filter_all', icon: LayoutGrid },
  { id: 'drones', labelKey: 'market_cat_drones', icon: Plane },
  { id: 'parts', labelKey: 'market_cat_parts', icon: Cpu },
  { id: 'goggles', labelKey: 'market_cat_goggles', icon: Glasses },
  { id: 'radios', labelKey: 'market_cat_radios_short', icon: Radio },
  { id: 'batteries', labelKey: 'market_cat_batteries', icon: Battery },
];

interface MarketplaceFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({ activeFilter, onFilterChange }) => {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
      {MARKET_FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
              isActive
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.2)]'
                : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={20} className={isActive ? 'text-sky-400' : 'text-slate-400'} />
            <span className="text-[10px] font-bold uppercase tracking-wide">{t(filter.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MarketplaceFilters;
