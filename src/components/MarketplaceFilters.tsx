import React from 'react';
import { LayoutGrid, Plane, Cpu, Glasses, Radio, Battery } from 'lucide-react';

const MARKET_FILTERS = [
  { id: 'all', label: 'ყველა', icon: LayoutGrid },
  { id: 'drones', label: 'დრონები', icon: Plane },
  { id: 'parts', label: 'ნაწილები', icon: Cpu },
  { id: 'goggles', label: 'სათვალეები', icon: Glasses },
  { id: 'radios', label: 'მართვა', icon: Radio },
  { id: 'batteries', label: 'ელემენტები', icon: Battery },
];

interface MarketplaceFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({ activeFilter, onFilterChange }) => {
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
            <span className="text-[10px] font-bold uppercase tracking-wide">{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MarketplaceFilters;
