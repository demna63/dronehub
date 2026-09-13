
import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import BackButton from './BackButton';
import { useLanguage } from '../contexts/useLanguage';
import { geminiService } from '../services/geminiService';
import { User } from '../types'; // ✅ დაამატე ეს ხაზი

interface RegulationsWikiProps {
  onBack: () => void;
  currentUser?: User | null;
}

type Category = 'OPEN' | 'SPECIFIC' | 'CERTIFIED';
type WeightClass = '< 250G' | '250G - 2KG' | '> 2KG';

const RegulationsWiki: React.FC<RegulationsWikiProps> = ({ onBack, currentUser: _currentUser }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('OPEN');
  const [activeWeight, setActiveWeight] = useState<WeightClass>('< 250G');
  const [zoneQuery, setZoneQuery] = useState('');
  const [zoneResult, setZoneResult] = useState<{ status: 'CLEAR' | 'RESTRICTED' | 'IDLE' | 'CAUTION'; message: string }>({ status: 'IDLE', message: '' });
  const [isChecking, setIsChecking] = useState(false);
  const { t } = useLanguage();

  const handleZoneCheck = async () => {
    if (!zoneQuery.trim()) {
      setZoneResult({ status: 'IDLE', message: t('waiting_input') });
      return;
    }

    setIsChecking(true);
    setZoneResult({ status: 'IDLE', message: t('processing') });

    try {
      const result = await geminiService.checkRestrictedZone(zoneQuery);
      setZoneResult(result);
    } catch (error) {
      setZoneResult({ status: 'IDLE', message: "ვერ მოხერხდა ინფორმაციის მოძიება." });
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleZoneCheck();
    }
  };

  const getRules = () => {
    if (activeCategory === 'SPECIFIC') {
      return {
        'AUTHORIZATION': 'MANDATORY (GCAA PERMIT REQUIRED)',
        'RISK ASSESSMENT': 'SORA REQUIRED',
        'REMOTE PILOT': 'COMPETENCY CERTIFICATE',
        'ALTITUDE': 'AS AUTHORIZED (>120M POSSIBLE)',
        'BVLOS': 'PERMITTED WITH AUTHORIZATION',
        'DROP OPERATIONS': 'PERMITTED WITH AUTHORIZATION'
      };
    }
    if (activeCategory === 'CERTIFIED') {
      return {
        'CERTIFICATION': 'AIRCRAFT & OPERATOR CERTIFICATION REQUIRED',
        'PILOT LICENSE': 'LICENSED REMOTE PILOT',
        'OPERATIONS': 'TRANSPORT OF PEOPLE / DANGEROUS GOODS',
        'OVERSIGHT': 'STRICT GCAA OVERSIGHT'
      };
    }

    const common = {
      'MAX ALTITUDE': '120M (AGL)',
      'VISUAL CONTACT': 'VLOS MANDATORY',
      'DROP OPERATIONS': 'STRICTLY PROHIBITED',
    };

    if (activeWeight === '< 250G') {
      return {
        ...common,
        'REGISTRATION': 'MANDATORY IF CAMERA EQUIPPED',
        'PILOT COMPETENCY': 'READ MANUAL (A1/A3 TRAINING RECOMMENDED)',
        'MINIMUM AGE': 'NO LIMIT (SUPERVISION RECOMMENDED)',
        'FLIGHT OVER PEOPLE': 'PERMITTED (NOT CROWDS)',
        'REMOTE ID': 'NOT REQUIRED'
      };
    }
    if (activeWeight === '250G - 2KG') {
      return {
        ...common,
        'REGISTRATION': 'MANDATORY (OPERATOR ID)',
        'PILOT COMPETENCY': 'A1/A3 CERTIFICATE REQUIRED',
        'MINIMUM AGE': '16 YEARS',
        'FLIGHT OVER PEOPLE': 'PROHIBITED (50M DISTANCE)',
        'REMOTE ID': 'MANDATORY (AFTER 2024)'
      };
    }
    return { 
      ...common,
      'REGISTRATION': 'MANDATORY (OPERATOR ID)',
      'PILOT COMPETENCY': 'A2 CERTIFICATE REQUIRED',
      'MINIMUM AGE': '16 YEARS',
      'FLIGHT OVER PEOPLE': 'PROHIBITED (150M DISTANCE)',
      'REMOTE ID': 'MANDATORY'
    };
  };

  const rules = getRules();

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 lg:p-12 animate-in fade-in duration-500 selection-sky">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* WikiGE INDUSTRIAL HEADER */}
        <div className="flex flex-col items-center gap-6 border-b border-white/5 pb-12 text-center">
          <div className="w-full flex justify-start">
            <BackButton onClick={onBack} className="!bg-transparent !border-transparent !px-0 hover:text-sky-400 transition-colors" />
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter typography-mtavruli text-white flex items-center justify-center gap-4">
              {t('reg_title')} <span className="text-5xl md:text-7xl">🇬🇪</span>
            </h1>
            <p className="text-[10px] font-black uppercase text-sky-500 tracking-[0.5em]">
              OFFICIAL DRONE REGULATIONS DATABASE / GCAA SYNC / v4.2
            </p>
          </div>
          <div className="h-px w-24 bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
        </div>

        {/* FILTERS CONTAINER */}
        <div className="space-y-12">
          {/* CATEGORY FILTERS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-3 bg-slate-700"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] typography-mtavruli">{t('reg_cat_mission')}</span>
            </div>
            <LayoutGroup id="category-filters">
              <div className="flex flex-wrap gap-10 border-b border-white/5 pb-0">
                {(['OPEN', 'SPECIFIC', 'CERTIFIED'] as Category[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="relative pb-5 group outline-none"
                  >
                    <span className={`text-[13px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${activeCategory === cat ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                      {cat}
                    </span>
                    {activeCategory === cat && (
                      <motion.div 
                        layoutId="cat-indicator"
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.8)] rounded-t z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </LayoutGroup>
          </div>

          {/* WEIGHT CLASS FILTERS */}
          <AnimatePresence mode="wait">
            {activeCategory === 'OPEN' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-3 bg-slate-700"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] typography-mtavruli">{t('reg_cat_mass')}</span>
                </div>
                <LayoutGroup id="weight-filters">
                  <div className="flex flex-wrap gap-10 border-b border-white/5 pb-0">
                    {(['< 250G', '250G - 2KG', '> 2KG'] as WeightClass[]).map(weight => (
                      <button
                        key={weight}
                        onClick={() => setActiveWeight(weight)}
                        className="relative pb-5 group outline-none"
                      >
                        <span className={`text-[13px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${activeWeight === weight ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                          {weight}
                        </span>
                        {activeWeight === weight && (
                          <motion.div 
                            layoutId="weight-indicator"
                            className="absolute bottom-0 left-0 right-0 h-[3px] bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.8)] rounded-t z-10"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RULES TELEMETRY DISPLAY */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-sky-500/5 rounded-[48px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 bg-slate-900 border border-white/5 p-10 lg:p-14 rounded-[40px] relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <svg className="w-32 h-32 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14h2v8h-2zm0 10h2v2h-2z"/></svg>
            </div>
            {Object.entries(rules).map(([key, value]) => {
              const isRestricted = value.includes('PROHIBITED') || value.includes('MANDATORY');
              return (
                <div key={key} className="flex flex-col gap-2 border-b border-white/5 pb-5 last:border-0 group/item">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] typography-mtavruli group-hover/item:text-slate-300 transition-colors">{key}</span>
                  <span className={`font-mono text-[13px] font-bold tracking-tight ${isRestricted ? 'text-rose-500' : 'text-sky-400'}`}>
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ZONE SCANNER */}
        <div className="space-y-8 pt-10 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] typography-mtavruli">{t('restricted_zone_check')}</h2>
          </div>
          <p className="text-[11px] text-amber-300/80">
            AI-შედეგები მხოლოდ საინფორმაციო მიზნებისთვისაა. ფრენამდე ყოველთვის შეამოწმეთ ოფიციალური წყაროები და NOTAM-ები.
          </p>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:flex-1 relative flex items-center gap-4">
               <span className="text-sky-500 font-bold">&gt;</span>
               <input 
                type="text" 
                value={zoneQuery}
                onChange={(e) => setZoneQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('enter_location')}
                className="flex-1 bg-transparent border-b border-white/10 py-3 text-sm font-mono text-white placeholder:text-slate-400 outline-none focus:border-sky-500/50 transition-colors uppercase tracking-widest"
              />
              <button 
                onClick={handleZoneCheck}
                disabled={isChecking || !zoneQuery.trim()}
                className="px-6 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
              >
                {isChecking ? t('reg_scanning') : t('reg_scan_btn')}
              </button>
            </div>
            <div className={`w-full md:w-80 p-6 border rounded-3xl font-mono text-[11px] leading-relaxed transition-all duration-500 shadow-sm ${
              zoneResult.status === 'RESTRICTED' ? 'text-rose-500 border-rose-500/20 bg-rose-500/10' : 
              zoneResult.status === 'CLEAR' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 
              zoneResult.status === 'CAUTION' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
              'text-slate-400 border-white/10 bg-white/5'
            }`}>
              <div className="flex items-center gap-2 mb-2 opacity-50">
                 <div className={`w-1.5 h-1.5 rounded-full ${zoneResult.status === 'IDLE' ? 'bg-slate-500' : 'animate-pulse bg-current'}`}></div>
                 <span>GCAA_AI_SCAN_RESULT</span>
              </div>
              <p className="font-bold">{zoneResult.message || t('waiting_input')}</p>
            </div>
          </div>
        </div>

        {/* FOOTER NOTICE */}
        <div className="pt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-[9px] text-slate-400 font-medium uppercase tracking-[0.2em] max-w-lg leading-relaxed">
            {t('reg_footer_notice')}
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegulationsWiki;
