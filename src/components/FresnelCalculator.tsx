import React, { useState, useMemo } from 'react';
import { Wifi, Mountain, Signal, Info, Activity } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage'; // <--- იმპორტი

const FresnelCalculator: React.FC = () => {
  const { t } = useLanguage(); // <--- ჰუკის გამოყენება

  // --- STATE ---
  const [frequency, setFrequency] = useState<number>(2400); // MHz
  const [distance, setDistance] = useState<number>(1); // Km

  // --- CALCULATIONS ---
  const results = useMemo(() => {
    if (!frequency || !distance) return { zone1: 0, zone80: 0, zone60: 0 };

    const fGHz = frequency / 1000;
    const zone1 = 8.656 * Math.sqrt(distance / fGHz);
    
    return {
      zone1: zone1,
      zone80: zone1 * 0.8,
      zone60: zone1 * 0.6
    };
  }, [frequency, distance]);

  return (
    <div className="p-6 space-y-8 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
          <Wifi size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            {t('fresnel_title') || 'Fresnel Zone Calculator'}
          </h2>
          <p className="text-sm text-ink-3 font-medium">
            {t('fresnel_desc') || 'Calculate Line of Sight (LoS) clearance requirements'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-bg/50 border border-white/10 rounded-2xl p-5 space-y-5">
            <h3 className="text-xs font-extrabold text-ink-3 mb-4 flex items-center gap-2">
              <Settings size={14} /> {t('link_params') || 'Link Parameters'}
            </h3>

            {/* Frequency Input */}
            <div className="space-y-2">
              <label htmlFor="fresnel-frequency" className="text-xs text-ink-3 font-bold ml-1">
                {t('frequency') || 'Frequency (MHz)'}
              </label>
              <div className="relative group">
                <input 
                  id="fresnel-frequency"
                  type="number" 
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="w-full bg-surface border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono transition-colors group-hover:bg-surface-2"
                  placeholder={t('freq_placeholder') || 'e.g. 2400'}
                />
                <Activity className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" size={16} />
              </div>
              <p className="text-xs text-ink-3 ml-1">
                {t('freq_hint') || '915MHz, 2400MHz, 5800MHz...'}
              </p>
            </div>

            {/* Distance Input */}
            <div className="space-y-2">
              <label htmlFor="fresnel-distance" className="text-xs text-ink-3 font-bold ml-1">
                {t('distance') || 'Distance (Km)'}
              </label>
              <div className="relative group">
                <input 
                  id="fresnel-distance"
                  type="number" 
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="w-full bg-surface border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono transition-colors group-hover:bg-surface-2"
                  placeholder={t('dist_placeholder') || 'e.g. 1.5'}
                />
                <Mountain className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" size={16} />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-accent-tint border border-accent/30 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Info className="text-accent flex-shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-accent leading-relaxed">
                <strong className="text-accent block mb-1">
                  {t('why_important') || 'Why is this important?'}
                </strong>
                {t('why_important_desc') || 'The Fresnel zone is an elliptical area between antennas. Even with visual line of sight, if this zone is obstructed, signal strength will drop drastically.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1st Zone */}
            <div className="bg-bg/50 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
              <h4 className="text-xs font-extrabold text-ink-3 mb-2 z-10">
                {t('zone_1') || '1st Zone (100%)'}
              </h4>
              <div className="text-3xl font-extrabold text-white font-mono z-10">
                {results.zone1.toFixed(1)} <span className="text-sm text-ink-3">m</span>
              </div>
              <p className="text-xs text-ink-3 mt-2 z-10">
                {t('total_radius') || 'Total Radius'}
              </p>
            </div>

            {/* 80% Zone */}
            <div className="bg-bg/50 border border-emerald-500/20 rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <div className="absolute inset-0 bg-emerald-500/10"></div>
              <h4 className="text-xs font-extrabold text-emerald-400 mb-2 z-10">
                {t('zone_80') || '80% Zone'}
              </h4>
              <div className="text-3xl font-extrabold text-white font-mono z-10">
                {results.zone80.toFixed(1)} <span className="text-sm text-ink-3">m</span>
              </div>
              <p className="text-xs text-emerald-400/70 mt-2 z-10">
                {t('optimal_clearance') || 'Optimal Clearance'}
              </p>
            </div>

            {/* 60% Zone */}
            <div className="bg-bg/50 border border-rose-500/20 rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors"></div>
              <h4 className="text-xs font-extrabold text-rose-400 mb-2 z-10">
                {t('zone_60') || '60% Zone'}
              </h4>
              <div className="text-3xl font-extrabold text-white font-mono z-10">
                {results.zone60.toFixed(1)} <span className="text-sm text-ink-3">m</span>
              </div>
              <p className="text-xs text-rose-400/70 mt-2 z-10">
                {t('critical_min') || 'Critical Minimum'}
              </p>
            </div>
          </div>

          {/* Visual Representation */}
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
             
             {/* Antennas & Line of Sight */}
             <div className="relative w-full max-w-lg h-32 flex items-center justify-between z-10">
                {/* TX */}
                <div className="flex flex-col items-center gap-2">
                   <div className="w-1 h-16 bg-slate-600 rounded-full relative">
                      <Signal className="absolute -top-6 -left-2.5 text-emerald-500" size={24} />
                   </div>
                   <span className="text-xs font-bold text-ink-3">TX</span>
                </div>

                {/* Zones Visualization (Ellipses) */}
                <div className="flex-1 h-full relative flex items-center justify-center mx-4">
                   {/* Center Line */}
                   <div className="absolute w-full h-[1px] bg-surface-2 border-t border-dashed border-slate-600"></div>
                   
                   {/* 100% Zone */}
                   <div className="absolute w-full h-full border border-white/10 rounded-[100%] opacity-50"></div>
                   <div className="absolute -top-4 text-xs text-ink-3 bg-[#0d1117] px-1">100%</div>
                   
                   {/* 60% Zone (Critical) */}
                   <div className="absolute w-full h-[60%] bg-rose-500/5 border border-rose-500/30 rounded-[100%]"></div>
                   <div className="absolute text-xs text-rose-500 font-bold">60%</div>
                </div>

                {/* RX */}
                <div className="flex flex-col items-center gap-2">
                   <div className="w-1 h-16 bg-slate-600 rounded-full relative">
                      <Signal className="absolute -top-6 -left-2.5 text-emerald-500" size={24} />
                   </div>
                   <span className="text-xs font-bold text-ink-3">RX</span>
                </div>
             </div>

             <div className="mt-8 text-center max-w-md">
                <p className="text-sm text-ink-2 leading-relaxed">
                   {t('explanation_text') || 'To ensure a stable connection, obstacles must be at least'} <span className="text-rose-400 font-bold">{results.zone60.toFixed(1)}m</span> {t('explanation_text_2') || 'below the line of sight. Ideally, keep'} <span className="text-emerald-400 font-bold">{results.zone80.toFixed(1)}m</span> {t('explanation_text_3') || 'clear.'}
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Icon helper
function Settings({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
    );
}

export default FresnelCalculator;