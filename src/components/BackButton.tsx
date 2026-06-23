
import React from 'react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, label = "უკან დაბრუნება", className = "" }) => {
  return (
    <button 
      onClick={onClick} 
      className={`group flex items-center gap-5 px-8 py-4 rounded-[28px] bg-slate-900 border border-white/5 text-[12px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-sky-400 hover:border-sky-500/30 transition-all hover:shadow-[0_20px_50px_rgba(56,189,248,0.1)] active:scale-95 ${className}`}
    >
      <div className="w-10 h-10 rounded-2xl bg-white/5 group-hover:bg-sky-500/10 flex items-center justify-center transition-all group-hover:-translate-x-1">
        <svg className="w-5 h-5 text-slate-400 group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </div>
      {label}
    </button>
  );
};

export default BackButton;
