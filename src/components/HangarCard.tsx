import React from 'react';
import { Settings, Zap, Aperture, Cpu, Edit2, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import { DRONE_STATUS_KEY } from '../constants/profile';

export interface DroneBuild {
  id: string;
  name: string;
  image?: string;
  frame: string;
  motors: string;
  fc_esc: string;
  vtx: string;
  camera: string;
  status: 'flying' | 'broken' | 'wip';
}

interface HangarCardProps {
  build: DroneBuild;
  isOwner?: boolean; // 👈 დამატებულია
  onEdit?: () => void; // 👈 დამატებულია
  onDelete?: () => void; // 👈 დამატებულია
}

const HangarCard: React.FC<HangarCardProps> = ({ build, isOwner, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const statusKey = DRONE_STATUS_KEY[build.status];
  const statusColors = {
    flying: 'bg-emerald-500 text-emerald-950',
    broken: 'bg-rose-500 text-rose-950',
    wip: 'bg-yellow-500 text-yellow-950'
  };

  return (
    <div className="group bg-surface border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden transition-all hover:shadow-xl relative">
      
      {/* 🟢 Action Buttons (გამოჩნდება მხოლოდ მფლობელისთვის) */}
      {isOwner && (
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="p-2 bg-bg/80 border border-white/10 rounded-lg text-ink-2 hover:text-white hover:bg-accent-tint hover:border-accent/30 transition-all"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-2 bg-bg/80 border border-white/10 rounded-lg text-ink-2 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/50 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Image / Header */}
      <div className="h-40 bg-bg relative overflow-hidden">
        {build.image ? (
          <img src={build.image} alt={build.name} className="w-full h-full object-cover transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-2">
            <Settings className="text-ink-3 w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent"></div>
        
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <h3 className="font-extrabold text-lg text-white truncate pr-2">{build.name}</h3>
          <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${statusColors[build.status]}`}>
            {statusKey ? t(statusKey) : build.status}
          </span>
        </div>
      </div>

      {/* Specs */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 text-xs text-ink-3">
          <Aperture size={14} className="text-accent shrink-0" />
          <span className="truncate flex-1">{build.frame || '-'}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-3">
          <Zap size={14} className="text-yellow-500 shrink-0" />
          <span className="truncate flex-1">{build.motors || '-'}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-3">
          <Cpu size={14} className="text-accent shrink-0" />
          <span className="truncate flex-1">{build.fc_esc || '-'}</span>
        </div>
      </div>
    </div>
  );
};

export default HangarCard;