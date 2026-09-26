
import React from 'react';
import { useLanguage } from '../contexts/useLanguage';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, label, className = "" }) => {
  // Defaulted in the body, not in the parameter list: a default parameter is
  // evaluated at module scope, where the hook does not exist.
  const { t } = useLanguage();
  const text = label ?? t('action_back');
  return (
    <button 
      onClick={onClick} 
      className={`group flex items-center gap-5 px-8 py-4 rounded-2xl bg-surface border border-white/5 text-[12px] font-extrabold tracking-[0.3em] text-ink-3 hover:text-accent hover:border-accent/30 transition-all hover:shadow-[0_20px_50px_rgba(56,189,248,0.1)] ${className}`}
    >
      <div className="w-10 h-10 rounded-2xl bg-white/5 group-hover:bg-accent-tint flex items-center justify-center transition-all">
        <svg className="w-5 h-5 text-ink-3 group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </div>
      {text}
    </button>
  );
};

export default BackButton;
