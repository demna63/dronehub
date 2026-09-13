import React, { useState, useMemo } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Waves, Radio, ArrowRight, Gauge } from 'lucide-react';
import { VTX_ALL_BANDS } from '../constants/toolsData';

const HarmonicsCalculator: React.FC = () => {
  // --- STATE ---
  const [centerFreq, setCenterFreq] = useState<number>(915);
  const [bandwidth, setBandwidth] = useState<number>(30);

  // --- CALCULATIONS ---
  const startFreq = centerFreq - (bandwidth / 2);
  const endFreq = centerFreq + (bandwidth / 2);

  const harmonics = useMemo(() => {
    const res = [];
    for (let i = 1; i <= 7; i++) {
      res.push({
        order: i,
        min: startFreq * i,
        max: endFreq * i,
        center: centerFreq * i
      });
    }
    return res;
  }, [centerFreq, startFreq, endFreq]);

  // --- ANALYSIS ---
  const analysis = useMemo(() => {
    const affected: Record<string, string[]> = {};
    const unaffected: Record<string, string[]> = {};

    VTX_ALL_BANDS.forEach(band => {
      band.channels.forEach(ch => {
        let isHit = false;
        let hitInfo = '';

        for (const h of harmonics) {
          if (h.order === 1) continue;
          // +/- 1 MHz tolerance
          if (ch.freq >= h.min - 1 && ch.freq <= h.max + 1) {
            isHit = true;
            hitInfo = `${ch.name} (${ch.freq} MHz) - Hit by #${h.order} (${h.min.toFixed(1)}-{${h.max.toFixed(1)}})`;
            break;
          }
        }

        if (isHit) {
          if (!affected[band.name]) affected[band.name] = [];
          affected[band.name].push(hitInfo);
        } else {
          if (!unaffected[band.name]) unaffected[band.name] = [];
          unaffected[band.name].push(`${ch.name} (${ch.freq} MHz)`);
        }
      });
    });

    return { affected, unaffected };
  }, [harmonics]);

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400 border border-rose-500/20">
          <Activity size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Harmonics Calculator</h2>
          <p className="text-sm text-slate-400 font-medium">Analyze RF interference across all VTX bands</p>
        </div>
      </div>

      {/* 2. Top Bar: Configuration & Range (Grid Layout) */}
      <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-end">
          
          {/* Input: Center Freq */}
          <div className="space-y-2">
            <label htmlFor="harmonics-center-freq" className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Radio size={14} /> Central Freq (MHz)
            </label>
            <div className="relative group">
              <input 
                id="harmonics-center-freq"
                type="number" 
                value={centerFreq}
                onChange={(e) => setCenterFreq(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 font-mono transition-colors group-hover:bg-slate-800"
              />
            </div>
          </div>

          {/* Input: Bandwidth */}
          <div className="space-y-2">
            <label htmlFor="harmonics-bandwidth" className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Waves size={14} /> Channel Width (MHz)
            </label>
            <div className="relative group">
              <input 
                id="harmonics-bandwidth"
                type="number" 
                value={bandwidth}
                onChange={(e) => setBandwidth(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 font-mono transition-colors group-hover:bg-slate-800"
              />
            </div>
          </div>

          {/* Output: Start Freq */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col justify-center h-[50px]">
             <div className="flex justify-between items-center">
               <span className="text-[10px] text-slate-400 font-bold uppercase">Start Freq</span>
               <span className="text-sm font-mono font-bold text-white">{startFreq.toFixed(2)} MHz</span>
             </div>
          </div>

          {/* Output: End Freq */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col justify-center h-[50px]">
             <div className="flex justify-between items-center">
               <span className="text-[10px] text-slate-400 font-bold uppercase">End Freq</span>
               <span className="text-sm font-mono font-bold text-white">{endFreq.toFixed(2)} MHz</span>
             </div>
          </div>

        </div>
      </div>

      {/* 3. Analysis Results (Middle Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Affected Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
            <AlertTriangle className="text-rose-500" size={18} />
            <h3 className="text-sm font-black text-rose-100 uppercase tracking-widest">Affected Channels</h3>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {Object.keys(analysis.affected).length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-950/30 rounded-xl border border-white/5">
                No interference detected. Safe to fly!
              </div>
            ) : (
              Object.entries(analysis.affected).map(([bandName, hits]) => (
                <div key={bandName} className="bg-rose-950/10 border border-rose-500/20 rounded-xl overflow-hidden">
                  <div className="bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-200 uppercase tracking-wider flex justify-between">
                    <span>{bandName}</span>
                    <span className="bg-rose-500/20 px-2 rounded-full text-[9px]">{hits.length} Hits</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {hits.map((hit, i) => (
                      <div key={i} className="text-[11px] text-rose-300 font-mono break-words flex items-start gap-2">
                        <ArrowRight size={12} className="mt-0.5 flex-shrink-0 opacity-50" />
                        {hit}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unaffected Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/20">
            <CheckCircle2 className="text-emerald-500" size={18} />
            <h3 className="text-sm font-black text-emerald-100 uppercase tracking-widest">Unaffected Channels</h3>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {Object.entries(analysis.unaffected).map(([bandName, channels]) => (
              <div key={bandName} className="bg-emerald-950/10 border border-emerald-500/10 rounded-xl overflow-hidden">
                <div className="bg-emerald-500/5 px-4 py-2 text-xs font-bold text-emerald-200 uppercase tracking-wider flex justify-between">
                   <span>{bandName}</span>
                   <span className="bg-emerald-500/10 px-2 rounded-full text-[9px]">{channels.length} Clear</span>
                </div>
                <div className="p-3 flex flex-wrap gap-2">
                  {channels.map((ch, i) => (
                    <div key={i} className="text-[10px] text-emerald-400/80 font-mono bg-emerald-500/5 border border-emerald-500/10 rounded px-2 py-1">
                      {ch}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: All Harmonics Table */}
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
          <Gauge size={16} className="text-indigo-400" />
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Calculated Harmonics Table</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black uppercase text-slate-400 bg-white/[0.02]">
              <tr>
                <th className="p-4 w-24">Order</th>
                <th className="p-4">Central Freq</th>
                <th className="p-4">Range (Min - Max)</th>
                <th className="p-4">Bandwidth</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono text-slate-300 divide-y divide-white/5">
              {harmonics.map((h) => (
                <tr key={h.order} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${h.order === 1 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {h.order === 1 ? 'Fund.' : `#${h.order}`}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white">{h.center.toFixed(2)} MHz</td>
                  <td className="p-4 text-slate-400">
                    {h.min.toFixed(2)} <span className="text-slate-400 mx-1">-</span> {h.max.toFixed(2)} MHz
                  </td>
                  <td className="p-4 text-slate-400">
                    {(h.max - h.min).toFixed(2)} MHz
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default HarmonicsCalculator;