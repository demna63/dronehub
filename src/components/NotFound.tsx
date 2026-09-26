
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/useLanguage';

const NotFound: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 space-y-8 duration-700">
      <div className="relative">
        <div className="absolute inset-0 bg-accent-tint blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative text-[120px] md:text-[180px] font-extrabold text-ink-3 leading-none select-none drop-shadow-2xl">
          404
          <span className="absolute top-0 left-0 text-white/5 blur-sm">404</span>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <div className="w-32 h-32 border-[4px] border-rose-500/50 rounded-full opacity-20"></div>
        </div>
      </div>

      <div className="space-y-4 max-w-md z-10">
        <h1 className="text-3xl font-extrabold text-white typography-mtavruli">
          {t('not_found_title') || 'Signal Lost'}
        </h1>
        <p className="text-ink-3 font-medium leading-relaxed">
          {t('not_found_desc') || 'The requested page could not be found.'}
        </p>
      </div>

      <Link 
        to="/" 
        className="px-10 py-4 bg-accent-fill hover:bg-accent-fill-hover text-white font-extrabold rounded-2xl text-xs tracking-[0.2em] shadow-lg transition-all z-10"
      >
        {t('not_found_btn') || 'Return to Home'}
      </Link>
    </div>
  );
};

export default NotFound;
