import React, { useState, useMemo } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Waves, Radio, ArrowRight, Gauge } from 'lucide-react';
import { VTX_ALL_BANDS } from '../constants/toolsData';
import { useLanguage } from '../contexts/useLanguage';
import { analyzeHarmonics, isValidInput } from '../utils/harmonics';
import LinkInterferencePanel from './LinkInterferencePanel';

const fmt = (n: number) => String(parseFloat(n.toFixed(2)));

const HarmonicsCalculator: React.FC = () => {
  const { t } = useLanguage();
  const [centerFreq, setCenterFreq] = useState<number>(915);
  const [bandwidth, setBandwidth] = useState<number>(30);

  const valid = isValidInput(centerFreq, bandwidth);
  const startFreq = centerFreq - bandwidth / 2;
  const endFreq = centerFreq + bandwidth / 2;

  const { harmonics, affected, unaffected } = useMemo(
    () => analyzeHarmonics(centerFreq, bandwidth, VTX_ALL_BANDS),
    [centerFreq, bandwidth],
  );
  const hitCount = useMemo(() => [...affected.values()].reduce((n, l) => n + l.length, 0), [affected]);
  const orderTitle = (order: number) => {
    const h = harmonics.find((x) => x.order === order)!;
    return t(order === 1 ? 'harm_fund_title' : 'harm_order_title', { order, min: fmt(h.min), max: fmt(h.max) });
  };

  return (
    <div className="p-6 space-y-8 duration-500">
      
      {/* 1. Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400 border border-rose-500/20">
          <Activity size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white">{t('harm_title')}</h2>
          <p className="text-sm text-ink-3 font-medium">{t('harm_subtitle')}</p>
        </div>
      </div>

      {/* 2. Top Bar: Configuration & Range (Grid Layout) */}
      <div className="bg-bg/50 border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-end">
          
          {/* Input: Center Freq */}
          <div className="space-y-2">
            <label htmlFor="harmonics-center-freq" className="text-xs font-extrabold text-ink-3 flex items-center gap-2">
              <Radio size={14} /> {t('harm_center')}
            </label>
            <div className="relative group">
              <input 
                id="harmonics-center-freq"
                type="number" 
                value={centerFreq}
                onChange={(e) => setCenterFreq(Number(e.target.value))}
                className="w-full bg-surface border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 font-mono transition-colors group-hover:bg-surface-2"
              />
            </div>
          </div>

          {/* Input: Bandwidth */}
          <div className="space-y-2">
            <label htmlFor="harmonics-bandwidth" className="text-xs font-extrabold text-ink-3 flex items-center gap-2">
              <Waves size={14} /> {t('harm_width')}
            </label>
            <div className="relative group">
              <input 
                id="harmonics-bandwidth"
                type="number" 
                value={bandwidth}
                onChange={(e) => setBandwidth(Number(e.target.value))}
                className="w-full bg-surface border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 font-mono transition-colors group-hover:bg-surface-2"
              />
            </div>
          </div>

          {/* Output: Start Freq */}
          <div className="bg-white/5 rounded-[10px] p-3 border border-white/5 flex flex-col justify-center h-[50px]">
             <div className="flex justify-between items-center">
               <span className="text-xs text-ink-3 font-bold">{t('harm_start')}</span>
               <span className="text-sm font-mono font-bold text-white">{valid ? fmt(startFreq) : '—'} MHz</span>
             </div>
          </div>

          {/* Output: End Freq */}
          <div className="bg-white/5 rounded-[10px] p-3 border border-white/5 flex flex-col justify-center h-[50px]">
             <div className="flex justify-between items-center">
               <span className="text-xs text-ink-3 font-bold">{t('harm_end')}</span>
               <span className="text-sm font-mono font-bold text-white">{valid ? fmt(endFreq) : '—'} MHz</span>
             </div>
          </div>

        </div>
      </div>

      <LinkInterferencePanel txFreq={centerFreq} txBw={bandwidth} />

      {/* 3. Analysis Results (Middle Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Affected Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
            <AlertTriangle className="text-rose-500" size={18} />
            <h3 className="text-sm font-extrabold text-rose-100">{t('harm_affected')}</h3>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {!valid ? (
              <div role="alert" className="p-8 text-center text-amber-300 text-xs bg-amber-500/5 rounded-[10px] border border-amber-500/20">
                {t('harm_invalid')}
              </div>
            ) : hitCount === 0 ? (
              <div className="p-8 text-center text-ink-3 text-xs bg-bg/30 rounded-[10px] border border-white/5">
                {t('harm_no_hits')}
              </div>
            ) : (
              [...affected.entries()].map(([order, hits]) => (
                <div key={order} className="bg-rose-950/10 border border-rose-500/20 rounded-[10px] overflow-hidden">
                  <div className="bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-200 flex justify-between gap-2">
                    <span>{orderTitle(order)}</span>
                    <span className="bg-rose-500/20 px-2 rounded-full text-xs whitespace-nowrap">{t('harm_hits', { count: hits.length })}</span>
                  </div>
                  <div className="p-3 flex flex-wrap gap-2">
                    {hits.map((hit) => (
                      <div key={`${hit.band}-${hit.name}`} className="text-xs text-rose-300 font-mono flex items-center gap-1 bg-rose-500/5 border border-rose-500/10 rounded px-2 py-1">
                        <ArrowRight size={12} className="opacity-50" />
                        {hit.name} ({hit.freq} MHz)
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
            <h3 className="text-sm font-extrabold text-emerald-100">{t('harm_unaffected')}</h3>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {valid && [...unaffected.entries()].map(([bandName, channels]) => (
              <div key={bandName} className="bg-emerald-950/10 border border-emerald-500/10 rounded-[10px] overflow-hidden">
                <div className="bg-emerald-500/5 px-4 py-2 text-xs font-bold text-emerald-200 flex justify-between">
                  <span>{bandName}</span>
                  <span className="bg-emerald-500/10 px-2 rounded-full text-xs">{t('harm_clear', { count: channels.length })}</span>
                </div>
                <div className="p-3 flex flex-wrap gap-2">
                  {channels.map((ch) => (
                    <div key={ch.name} className="text-xs text-emerald-400/80 font-mono bg-emerald-500/5 border border-emerald-500/10 rounded px-2 py-1">
                      {ch.name} ({ch.freq} MHz)
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {valid && unaffected.size === 0 && (
              <div className="p-8 text-center text-ink-3 text-xs bg-bg/30 rounded-[10px] border border-white/5">{t('harm_all_hit')}</div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: All Harmonics Table */}
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
          <Gauge size={16} className="text-accent" />
          <h3 className="text-xs font-extrabold text-ink-2">{t('harm_table_title')}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs font-extrabold text-ink-3 bg-white/[0.02]">
              <tr>
                <th className="p-4 w-24">{t('harm_col_order')}</th>
                <th className="p-4">{t('harm_col_center')}</th>
                <th className="p-4">{t('harm_col_range')}</th>
                <th className="p-4">{t('harm_col_width')}</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono text-ink-2 divide-y divide-white/5">
              {harmonics.map((h) => (
                <tr key={h.order} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${h.order === 1 ? 'bg-accent-tint text-accent border border-accent/30' : 'bg-surface-2 text-ink-3 border border-white/10'}`}>
                      {h.order === 1 ? t('harm_fund') : `#${h.order}`}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white">{fmt(h.center)} MHz</td>
                  <td className="p-4 text-ink-3">
                    {fmt(h.min)} <span className="text-ink-3 mx-1">-</span> {fmt(h.max)} MHz
                  </td>
                  <td className="p-4 text-ink-3">
                    {fmt(h.max - h.min)} MHz
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-ink-3">{t('harm_note')}</p>

    </div>
  );
};

export default HarmonicsCalculator;