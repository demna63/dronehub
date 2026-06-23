
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const NotFound: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 space-y-8 animate-in fade-in duration-700">
      <div className="relative">
        <div className="absolute inset-0 bg-sky-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative text-[120px] md:text-[180px] font-black text-slate-900 leading-none select-none drop-shadow-2xl">
          404
          <span className="absolute top-0 left-0 text-white/5 blur-sm">404</span>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <div className="w-32 h-32 border-[4px] border-rose-500/50 rounded-full animate-ping opacity-20"></div>
        </div>
      </div>

      <div className="space-y-4 max-w-md z-10">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight typography-mtavruli">
          Signal Lost
        </h1>
        <p className="text-slate-400 font-medium leading-relaxed">
          The requested telemetry data could not be found. The drone might be out of range or the frequency is jammed.
        </p>
      </div>

      <Link 
        to="/" 
        className="px-10 py-4 bg-sky-500 hover:bg-sky-400 text-white font-black rounded-[24px] text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-sky-500/20 transition-all active:scale-95 z-10 hover:-translate-y-1"
      >
        Return to Home Point
      </Link>
    </div>
  );
};

export default NotFound;
