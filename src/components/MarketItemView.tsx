import React, { useState } from 'react';
import { Post, User } from '../types';
import {
  MapPin,
  Phone,
  User as UserIcon,
  Tag,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Heart,
  Box,
  Eye
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatShortDate } from '../utils/dates';
import { useLanguage } from '../contexts/useLanguage';

interface SpecRowProps {
  label: string;
  /** Rendered as '-' when empty, so a missing spec still occupies its row. */
  value?: string | number;
  icon: LucideIcon;
}

/**
 * Declared at module scope on purpose. Defined inside `MarketItemView` it was a
 * new component type on every render, so React unmounted and remounted all four
 * rows each time the parent re-rendered.
 */
const SpecRow: React.FC<SpecRowProps> = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-2 text-slate-400 text-sm">
      <Icon size={16} />
      <span>{label}</span>
    </div>
    <div className="font-medium text-slate-200 text-sm">{value || '-'}</div>
  </div>
);

interface MarketItemViewProps {
  item: Post;
  currentUser: User | null;
  onLoginClick: () => void;
  onToggleSave: (id: string) => void;
  isSaved: boolean;
}

const MarketItemView: React.FC<MarketItemViewProps> = ({ 
  item, currentUser, onLoginClick, onToggleSave, isSaved 
}) => {
  const { t } = useLanguage();
  const [showPhone, setShowPhone] = useState(false);

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <h1 className="sr-only">{t('market_listing_heading', { title: item.title })}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ================= LEFT COLUMN (Image & Info) ================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. MAIN IMAGE CONTAINER */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative group">
            <div className="aspect-video w-full bg-black/40 flex items-center justify-center">
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-contain max-h-[500px]" 
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Box size={48} />
                  <span className="text-sm font-bold uppercase">{t('market_no_image')}</span>
                </div>
              )}
            </div>
            
            {/* Image Overlay Stats */}
            <div className="absolute bottom-4 left-4 flex gap-2">
               <span className="bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                 <Eye size={14} className="text-sky-400" /> {item.views || 0} ნახვა
               </span>
               <span className="bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                 <Calendar size={14} className="text-sky-400" /> {formatShortDate(item.createdAt) || t('time_just_now')}
               </span>
            </div>
          </div>

          {/* 2. DESCRIPTION & SPECS */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">{t('market_details_title')}</h2>
            
            {/* Specs Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 mb-8">
               <SpecRow 
                 icon={Tag} label={t('field_condition')} 
                 value={item.condition === 'new' ? 'ახალი' : item.condition === 'used' ? 'მეორადი' : 'დაზიანებული'} 
               />
               <SpecRow icon={Box} label={t('field_brand_model')} value={item.brand} />
               <SpecRow icon={Box} label={t('field_category')} value={item.subCategory} />
               <SpecRow icon={MapPin} label={t('field_location')} value={item.location} />
            </div>

            {/* Description Text */}
            <div className="prose prose-invert prose-sm max-w-none">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">{t('field_description')}</h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {item.content || t('market_no_description')}
              </p>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN (Sticky Sidebar) ================= */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          
          {/* 1. PRICE & ACTION CARD */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl">
            
            {/* Header: Title & Save */}
            <div className="flex justify-between items-start gap-4 mb-4">
               <h2 className="text-xl font-bold text-white leading-snug">{item.title}</h2>
               <button 
                 type="button"
                 onClick={() => onToggleSave(item.id)}
                 aria-label={isSaved ? t('action_unsave') : t('action_save')}
                 className={`p-2 rounded-lg transition-colors ${isSaved ? 'text-rose-500 bg-rose-500/10' : 'text-slate-400 hover:bg-white/5'}`}
               >
                 <Heart size={20} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />
               </button>
            </div>

            {/* Price */}
            <div className="mb-6">
               <span className="text-3xl font-black text-emerald-400 tracking-tight">
                 {item.price ? `${item.price} ₾` : t('price_negotiable')}
               </span>
               {item.condition && (
                 <span className="ml-3 text-xs font-bold px-2 py-1 bg-white/5 rounded text-slate-400 border border-white/10 uppercase align-middle">
                   {item.condition === 'new' ? 'ახალი' : 'მეორადი'}
                 </span>
               )}
            </div>

            {/* Buttons */}
            <div className="space-y-3">
               <button 
                 onClick={() => {
                   if (!currentUser) {
                     onLoginClick();
                     return;
                   }
                   setShowPhone(!showPhone);
                 }}
                 className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                   showPhone ? 'bg-slate-800 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                 }`}
               >
                 <Phone size={18} />
                 {showPhone ? (item.phone || t('phone_unknown')) : t('phone_show')}
               </button>

               <button 
                 onClick={onLoginClick}
                 className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20"
               >
                 <MessageSquare size={18} />
                 {t('market_message_in_chat')}
               </button>
            </div>
          </div>

          {/* 2. SELLER INFO */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden border border-white/10 shrink-0">
               {item.authorAvatar ? (
                 <img src={item.authorAvatar} alt="Seller" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-400"><UserIcon size={20}/></div>
               )}
             </div>
             <div className="flex-1 min-w-0">
               <h2 className="font-bold text-white truncate flex items-center gap-1">
                 {item.author}
                 <CheckCircle2 size={14} className="text-sky-500" />
               </h2>
               <p className="text-xs text-slate-400">{t('market_registered_pilot')}</p>
             </div>
          </div>

          {/* 3. SAFETY NOTICE */}
          <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 flex gap-3">
             <div className="shrink-0 mt-0.5"><ShieldCheck size={18} className="text-rose-400" /></div>
             <p className="text-[11px] text-rose-200/60 leading-relaxed">
               <strong>{t('market_safety_label')}</strong> {t('market_safety_note')}
             </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default MarketItemView;