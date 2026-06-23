
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const LOCATIONS = [
  'TBILISI', 'BATUMI', 'KUTAISI', 'GUDAURI', 'MESTIA', 'TELAVI', 'RUSTAVI'
];

interface TelemetryData {
  temp: number;
  condition: string;
  windSpeed: number;
  windGust: number;
  sats: number;
  hdop: number;
  kp: number;
  location: string;
  status: 'safe_to_fly' | 'caution' | 'unsafe';
}

const DroneWeatherWidget: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const generateTelemetry = (location: string): TelemetryData => {
    const isMountain = ['GUDAURI', 'MESTIA'].includes(location);
    const isCoastal = ['BATUMI'].includes(location);
    const isWindyCity = ['KUTAISI'].includes(location);

    let temp = 24;
    let windSpeed = 12;
    let kp = 2;
    let sats = 18;
    let status: TelemetryData['status'] = 'safe_to_fly';

    if (isMountain) {
      temp = 5; windSpeed = 22; kp = 3; sats = 24; status = 'caution';
    } else if (isCoastal) {
      temp = 26; windSpeed = 18; kp = 2; status = 'safe_to_fly';
    } else if (isWindyCity) {
      temp = 23; windSpeed = 35; status = 'unsafe';
    } else {
      temp = 25; windSpeed = 10; kp = 1; sats = 16; status = 'safe_to_fly';
    }

    return {
      temp: temp + Math.floor(Math.random() * 4) - 2,
      condition: isMountain ? 'Cloudy' : isCoastal ? 'Humid' : 'Clear Sky',
      windSpeed: windSpeed,
      windGust: windSpeed + 5 + Math.floor(Math.random() * 5),
      sats: sats,
      hdop: 0.8,
      kp: kp,
      location: location,
      status: status
    };
  };

  const [telemetry, setTelemetry] = useState<TelemetryData>(generateTelemetry('TBILISI'));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (loc: string) => {
    setTelemetry(generateTelemetry(loc));
    setIsOpen(false);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'safe_to_fly': 
        return {
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]',
          label: t('w_safe')
        };
      case 'caution': 
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
          label: t('w_caution')
        };
      default: 
        return {
          text: 'text-rose-400',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/20',
          glow: 'shadow-[0_0_12px_rgba(244,63,94,0.2)]',
          label: t('w_unsafe')
        };
    }
  };

  const status = getStatusStyles(telemetry.status);

  return (
    <div className="rounded-[40px] border border-white/5 bg-slate-900/50 p-8 space-y-8 shadow-sm hover:shadow-md transition-all duration-500 relative z-20">
      <div className="space-y-5">
         <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] typography-mtavruli">
                {t('w_title')}
              </span>
            </div>
            <div className="flex items-center gap-1">
               <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">{t('w_live')}</span>
            </div>
         </div>
         
         <div className={`p-5 rounded-[24px] border transition-all duration-500 ${status.bg} ${status.border} ${status.glow}`}>
            <div className="flex items-center justify-between mb-3">
               <span className={`text-[11px] font-black uppercase tracking-widest typography-mtavruli ${status.text}`}>
                 {status.label}
               </span>
               <svg className={`w-5 h-5 ${status.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
               </svg>
            </div>
            <div className="flex justify-between items-baseline relative" ref={dropdownRef}>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider typography-mtavruli opacity-60">{t('w_loc')}</span>
               
               <button 
                 onClick={() => setIsOpen(!isOpen)}
                 className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 -mr-2 rounded-lg transition-colors group"
               >
                 <span className="font-mono text-[11px] font-black text-white tracking-wider">{telemetry.location}</span>
                 <svg className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
               </button>

               <AnimatePresence>
                 {isOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute top-full right-0 mt-2 w-40 bg-slate-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 py-1"
                   >
                     {LOCATIONS.map(loc => (
                       <button
                         key={loc}
                         onClick={() => handleLocationSelect(loc)}
                         className={`w-full text-right px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-white/5 ${telemetry.location === loc ? 'text-sky-400' : 'text-slate-400'}`}
                       >
                         {loc}
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-1.5 hover:bg-white/10 hover:border-sky-500/20 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest typography-mtavruli group-hover:text-sky-400 transition-colors">{t('w_wind')}</span>
              <svg className="w-3 h-3 text-slate-400 group-hover:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span className="font-mono text-sm font-black text-white">{telemetry.windSpeed} <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">km/s</span></span>
         </div>

         <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-1.5 hover:bg-white/10 hover:border-orange-500/20 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest typography-mtavruli group-hover:text-orange-400 transition-colors">{t('w_temp')}</span>
              <svg className="w-3 h-3 text-slate-400 group-hover:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <span className="font-mono text-sm font-black text-white">{telemetry.temp}°C</span>
         </div>

         <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-1.5 hover:bg-white/10 hover:border-emerald-500/20 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest typography-mtavruli group-hover:text-emerald-400 transition-colors">{t('w_gps')}</span>
              <svg className="w-3 h-3 text-slate-400 group-hover:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 21s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 7.2c0 7.3-8 11.8-8 11.8z" strokeWidth="2"/><circle cx="12" cy="10" r="3" strokeWidth="2"/></svg>
            </div>
            <span className="font-mono text-sm font-black text-white">{telemetry.sats} <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">SAT</span></span>
         </div>

         <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-1.5 hover:bg-white/10 hover:border-indigo-500/20 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest typography-mtavruli group-hover:text-indigo-400 transition-colors">{t('w_k_index')}</span>
              <svg className="w-3 h-3 text-slate-400 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span className={`font-mono text-sm font-black ${telemetry.kp < 4 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {telemetry.kp} <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">({telemetry.kp < 4 ? 'OK' : 'HIGH'})</span>
            </span>
         </div>
      </div>

      <div className="pt-2 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/5"></div>
          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-[0.3em]">{t('w_sync')}</span>
          <div className="flex-1 h-px bg-white/5"></div>
        </div>
      </div>
    </div>
  );
};

export default DroneWeatherWidget;
