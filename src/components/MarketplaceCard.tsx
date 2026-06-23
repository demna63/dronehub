import React from 'react';
import { Post } from '../types';
import { MapPin, Clock, Eye, Image as ImageIcon } from 'lucide-react';

interface MarketplaceCardProps {
  item: Post;
  onClick: () => void;
}

const MarketplaceCard: React.FC<MarketplaceCardProps> = ({ item, onClick }) => {
  
  // ფასი დაფორმატებული
  const priceDisplay = item.price ? `${item.price} ₾` : 'შეთანხმებით';

  // მდგომარეობის ფერი
  const getConditionStyle = (cond?: string) => {
    switch(cond) {
      case 'new': return 'bg-emerald-500 text-white';
      case 'used': return 'bg-amber-500 text-white';
      case 'damaged': return 'bg-rose-500 text-white';
      default: return 'bg-slate-600 text-slate-200';
    }
  };

  const getConditionLabel = (cond?: string) => {
    switch(cond) {
      case 'new': return 'ახალი';
      case 'used': return 'მეორადი';
      case 'damaged': return 'ნაწილები';
      default: return 'უცნობია';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-slate-900 border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col h-full"
    >
      {/* 1. IMAGE AREA */}
      <div className="relative h-48 bg-slate-950 overflow-hidden">
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700">
            <ImageIcon size={32} />
          </div>
        )}
        
        {/* Condition Badge (Top Right) */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-lg ${getConditionStyle(item.condition)}`}>
          {getConditionLabel(item.condition)}
        </div>

        {/* Price Tag (Bottom Left - Floating) */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg shadow-lg">
          <span className="text-sm font-black text-emerald-400 font-mono tracking-tight">
            {priceDisplay}
          </span>
        </div>
      </div>

      {/* 2. CONTENT AREA */}
      <div className="p-4 flex flex-col flex-1">
        
        {/* Title */}
        <h3 className="font-bold text-slate-200 text-sm mb-1 line-clamp-2 leading-snug group-hover:text-white transition-colors">
          {item.title}
        </h3>

        {/* Subtitle / Brand */}
        {item.brand && (
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 block">
             {item.brand} • {item.subCategory}
           </span>
        )}

        {/* Footer Info (Location & Time) */}
        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
           <div className="flex items-center gap-1">
              <MapPin size={12} className="text-slate-400" />
              <span className="truncate max-w-[80px]">{item.location || 'საქართველო'}</span>
           </div>
           <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-slate-400" />
                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('ka-GE') : 'ახლახანს'}
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceCard;