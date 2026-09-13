import React, { useState, useMemo } from 'react';
import { Signal, Target, Settings, ListFilter, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import { VTX_ALL_BANDS } from '../constants/toolsData';

const ChannelTuner: React.FC = () => {  // <-- AntennaTuner-ის ნაცვლად  const { t } = useLanguage();
const { t } = useLanguage(); // <--- ეს ხაზი აკლია, დაამატეთ!
  // --- STATE ---
  const [startFreq, setStartFreq] = useState<number>(5700);
  const [endFreq, setEndFreq] = useState<number>(5900);
  const [numResults, setNumResults] = useState<number>(8);
  const [includeDigital, setIncludeDigital] = useState<boolean>(true);

  // --- CALCULATIONS ---
  const centerFreq = (startFreq + endFreq) / 2;

  const results = useMemo(() => {
    // 1. გავშალოთ ყველა არხი ერთ მასივში
    const allChannels: { band: string; name: string; freq: number }[] = [];
    
    VTX_ALL_BANDS.forEach(bandGroup => {
      // ციფრულის ფილტრაცია (სახელების მიხედვით ვხვდებით)
      const isDigital = bandGroup.name.includes('O3') || bandGroup.name.includes('Wlk') || bandGroup.name.includes('Avatar');
      
      if (!includeDigital && isDigital) return;

      bandGroup.channels.forEach(ch => {
        // ვტოვებთ მხოლოდ იმ არხებს, რომლებიც მოცემულ დიაპაზონშია
        if (ch.freq >= startFreq && ch.freq <= endFreq) {
          allChannels.push({
            band: bandGroup.name,
            name: ch.name,
            freq: ch.freq
          });
        }
      });
    });

    // 2. დავალაგოთ ცენტრალურ სიხშირესთან სიახლოვის მიხედვით
    // (რაც უფრო ნაკლებია სხვაობა, მით უკეთესია)
    allChannels.sort((a, b) => {
      const diffA = Math.abs(a.freq - centerFreq);
      const diffB = Math.abs(b.freq - centerFreq);
      return diffA - diffB;
    });

    // 3. დავაბრუნოთ მხოლოდ მოთხოვნილი რაოდენობა
    return allChannels.slice(0, numResults);

  }, [startFreq, endFreq, centerFreq, numResults, includeDigital]);

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-400 border border-orange-500/20">
          <Target size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {t('ant_title') || 'The closest channel by frequency'}
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            {t('ant_desc') || 'Find the most productive video channel for a particular antenna'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-5 space-y-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings size={14} /> Configuration
            </h3>

            {/* Start Freq */}
            <div className="space-y-2">
              <label htmlFor="channel-start-freq" className="text-[10px] text-slate-400 font-bold uppercase ml-1">
                {t('ant_start_freq') || 'Start (MHz)'}
              </label>
              <div className="relative group">
                <input 
                  id="channel-start-freq"
                  type="number" 
                  value={startFreq}
                  onChange={(e) => setStartFreq(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 font-mono transition-colors group-hover:bg-slate-800"
                />
              </div>
            </div>

            {/* End Freq */}
            <div className="space-y-2">
              <label htmlFor="channel-end-freq" className="text-[10px] text-slate-400 font-bold uppercase ml-1">
                {t('ant_end_freq') || 'End (MHz)'}
              </label>
              <div className="relative group">
                <input 
                  id="channel-end-freq"
                  type="number" 
                  value={endFreq}
                  onChange={(e) => setEndFreq(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 font-mono transition-colors group-hover:bg-slate-800"
                />
              </div>
            </div>

            {/* Count Select */}
            <div className="space-y-2">
              <label htmlFor="channel-num-results" className="text-[10px] text-slate-400 font-bold uppercase ml-1">
                {t('ant_num_channels') || 'Number of channels'}
              </label>
              <select 
                id="channel-num-results"
                value={numResults} 
                onChange={(e) => setNumResults(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* Digital Toggle */}
            <div className="pt-2">
              <label htmlFor="channel-include-digital" className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${includeDigital ? 'bg-orange-500 border-orange-500' : 'border-white/20 bg-slate-900'}`}>
                  {includeDigital && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <input 
                  id="channel-include-digital"
                  type="checkbox" 
                  className="hidden" 
                  checked={includeDigital} 
                  onChange={(e) => setIncludeDigital(e.target.checked)} 
                />
                <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                  {t('ant_include_digital') || 'Include digital bands'}
                </span>
              </label>
            </div>

          </div>

          {/* Info Block - Center Freq */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5 text-center">
             <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">
               {t('ant_center_freq') || 'Ideal Center Frequency'}
             </div>
             <div className="text-3xl font-black text-white font-mono">
               {centerFreq.toFixed(1)} <span className="text-sm text-slate-400">MHz</span>
             </div>
          </div>
        </div>

        {/* Right: Results List */}
        <div className="lg:col-span-2 flex flex-col h-full">
           <div className="flex items-center gap-2 mb-4 px-2">
             <ListFilter className="text-orange-500" size={18} />
             <h3 className="text-sm font-black text-white uppercase tracking-widest">
               {t('ant_results') || 'Calculated Channels'}
             </h3>
           </div>

           <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden flex-1 shadow-2xl">
             {results.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-white/[0.02] text-[10px] font-black uppercase text-slate-400">
                     <tr>
                       <th className="p-4 pl-6">Channel Name</th>
                       <th className="p-4">Frequency</th>
                       <th className="p-4 text-right pr-6">Deviation</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5 text-sm font-mono text-slate-300">
                     {results.map((ch, idx) => {
                       const diff = Math.abs(ch.freq - centerFreq);
                       const isBest = idx === 0; // First one is always best due to sorting
                       return (
                         <tr key={idx} className={`transition-colors ${isBest ? 'bg-orange-500/10 hover:bg-orange-500/20' : 'hover:bg-white/[0.02]'}`}>
                           <td className="p-4 pl-6">
                             <div className="flex items-center gap-3">
                               {isBest && <Signal size={14} className="text-orange-500 animate-pulse" />}
                               <span className={isBest ? 'text-white font-bold' : ''}>{ch.name}</span>
                               <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 rounded">{ch.band}</span>
                             </div>
                           </td>
                           <td className={`p-4 font-bold ${isBest ? 'text-orange-400' : 'text-slate-200'}`}>
                             {ch.freq} MHz
                           </td>
                           <td className="p-4 text-right pr-6">
                             <span className={`text-xs ${diff === 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                               {diff === 0 ? 'PERFECT' : `±${diff.toFixed(1)} MHz`}
                             </span>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                 <Signal className="w-8 h-8 opacity-20" />
                 <p className="text-xs uppercase tracking-widest">No channels found in range</p>
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default ChannelTuner; // <-- აქაც შეცვალეთ