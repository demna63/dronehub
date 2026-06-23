
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center font-mono text-[10px] font-black tracking-widest select-none">
      <span className="text-white/10 mr-1">[</span>
      
      <button 
        onClick={() => setLanguage('ka')}
        className={`relative px-1 transition-colors duration-300 ${language === 'ka' ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400 hover:text-slate-400'}`}
      >
        GE
        {language === 'ka' && (
          <motion.div 
            layoutId="lang-glow"
            className="absolute bottom-0 left-0 right-0 h-[1px] bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.8)]"
          />
        )}
      </button>

      <span className="text-white/10 mx-1">|</span>

      <button 
        onClick={() => setLanguage('en')}
        className={`relative px-1 transition-colors duration-300 ${language === 'en' ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400 hover:text-slate-400'}`}
      >
        EN
        {language === 'en' && (
          <motion.div 
            layoutId="lang-glow"
            className="absolute bottom-0 left-0 right-0 h-[1px] bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.8)]"
          />
        )}
      </button>

      <span className="text-white/10 ml-1">]</span>
    </div>
  );
};

export default LanguageSwitcher;
