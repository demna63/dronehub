import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/useLanguage';
import {
  RefreshCw,
  ArrowRightLeft,
  Battery,
  Signal,
  Scissors,
  Target,
  AlertTriangle
} from 'lucide-react';

// ============================================================================
// 1. UNIT CONVERTER COMPONENT
// ============================================================================
export const UnitConverter: React.FC = () => {
  const { t } = useLanguage();
  // --- mW <-> dBm State ---
  const [mw, setMw] = useState<string>("25");
  const [dbm, setDbm] = useState<string>("14");

  // --- LiPo Voltage State ---
  const [cells, setCells] = useState<number>(4); // 4S, 6S etc.
  
  const handleMwChange = (val: string) => {
    setMw(val);
    const m = parseFloat(val);
    if (!isNaN(m) && m > 0) {
      setDbm((10 * Math.log10(m)).toFixed(2));
    } else {
      setDbm("");
    }
  };

  const handleDbmChange = (val: string) => {
    setDbm(val);
    const d = parseFloat(val);
    if (!isNaN(d)) {
      setMw((Math.pow(10, d / 10)).toFixed(2));
    } else {
      setMw("");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="text-center space-y-2 border-b border-white/10 pb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 mb-2">
           <RefreshCw size={24} />
        </div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter">
           UNIT <span className="text-orange-400">CONVERTER</span>
        </h1>
        <p className="text-slate-400 text-xs max-w-xl mx-auto">
           {t('rf_convert_desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RF POWER */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                <Signal className="text-orange-400" size={20} />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">RF Power (VTX)</h2>
            </div>
            <div className="space-y-6 relative">
                <div className="space-y-2">
                    <label htmlFor="rf-milliwatts" className="text-[10px] font-bold text-slate-400 uppercase">Milliwatts</label>
                    <div className="relative">
                        <input 
                            id="rf-milliwatts"
                            type="number" 
                            value={mw}
                            onChange={(e) => handleMwChange(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 text-white text-lg font-mono rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                            placeholder="e.g. 800"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">mW</span>
                    </div>
                </div>
                <div className="flex justify-center -my-3 relative z-10">
                    <div className="bg-slate-800 p-2 rounded-full border border-white/10 text-slate-400">
                        <ArrowRightLeft size={16} />
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="rf-dbm" className="text-[10px] font-bold text-slate-400 uppercase">Decibel-milliwatts</label>
                    <div className="relative">
                        <input 
                            id="rf-dbm"
                            type="number" 
                            value={dbm}
                            onChange={(e) => handleDbmChange(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 text-orange-400 text-lg font-mono rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                            placeholder="e.g. 29"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">dBm</span>
                    </div>
                </div>
            </div>
        </div>

        {/* LIPO VOLTAGE */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                <Battery className="text-emerald-400" size={20} />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">LiPo Voltage</h2>
            </div>
            <div className="space-y-4">
                <div>
                    <span id="rf-cell-count-label" className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Cell Count (S)</span>
                    <div className="flex flex-wrap gap-2" role="group" aria-labelledby="rf-cell-count-label">
                        {[1, 2, 3, 4, 6].map((s) => (
                            <button
                                key={s}
                                onClick={() => setCells(s)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    cells === s 
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                                }`}
                            >
                                {s}S
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                        <div className="text-[9px] text-slate-400 uppercase">Empty (3.5v)</div>
                        <div className="text-xl font-mono text-rose-400">{(cells * 3.5).toFixed(1)}V</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                        <div className="text-[9px] text-slate-400 uppercase">Storage (3.8v)</div>
                        <div className="text-xl font-mono text-blue-400">{(cells * 3.8).toFixed(1)}V</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-white/5 col-span-2">
                        <div className="text-[9px] text-slate-400 uppercase">Full Charge (4.2v)</div>
                        <div className="text-2xl font-mono text-emerald-400">{(cells * 4.2).toFixed(1)}V</div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. ANTENNA TUNER COMPONENT
// ============================================================================
export const AntennaTuner: React.FC = () => {
  const { t } = useLanguage();
  const [targetFreq, setTargetFreq] = useState<string>("915");
  const [measuredFreq, setMeasuredFreq] = useState<string>("890");
  const [currentLength, setCurrentLength] = useState<string>("80");
  
  const [cutAmount, setCutAmount] = useState<number | null>(null);
  const [newLength, setNewLength] = useState<number | null>(null);
  const [warning, setWarning] = useState<string>("");

  useEffect(() => {
    const fTarget = parseFloat(targetFreq);
    const fMeas = parseFloat(measuredFreq);
    const lCurr = parseFloat(currentLength);

    if (isNaN(fTarget) || isNaN(fMeas) || isNaN(lCurr) || fTarget <= 0 || fMeas <= 0) {
        setCutAmount(null);
        return;
    }

    const lNew = lCurr * (fMeas / fTarget);
    const delta = lCurr - lNew;

    setNewLength(lNew);
    setCutAmount(delta);

    if (fMeas > fTarget) {
        setWarning(t('rf_antenna_too_short'));
    } else {
        setWarning("");
    }
  }, [targetFreq, measuredFreq, currentLength, t]);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="text-center space-y-2 border-b border-white/10 pb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-400 mb-2">
           <Scissors size={24} />
        </div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter">
           ANTENNA <span className="text-yellow-400">TUNER</span>
        </h1>
        <p className="text-slate-400 text-xs max-w-xl mx-auto">
           {t('rf_trim_desc')}
        </p>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-lg">
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
                <label htmlFor="rf-target-freq" className="text-[10px] font-bold text-slate-400 uppercase">Target Freq (MHz)</label>
                <div className="relative">
                    <input 
                        id="rf-target-freq"
                        type="number" 
                        value={targetFreq}
                        onChange={(e) => setTargetFreq(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 text-white text-sm rounded-xl px-3 py-3 focus:border-yellow-500 outline-none"
                    />
                    <Target size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                </div>
            </div>
            <div className="space-y-1">
                <label htmlFor="rf-measured-freq" className="text-[10px] font-bold text-slate-400 uppercase">Measured Freq</label>
                <input 
                    id="rf-measured-freq"
                    type="number" 
                    value={measuredFreq}
                    onChange={(e) => setMeasuredFreq(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white text-sm rounded-xl px-3 py-3 focus:border-yellow-500 outline-none"
                />
            </div>
            <div className="space-y-1">
                <label htmlFor="rf-current-length" className="text-[10px] font-bold text-slate-400 uppercase">Current Length (mm)</label>
                <input 
                    id="rf-current-length"
                    type="number" 
                    value={currentLength}
                    onChange={(e) => setCurrentLength(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white text-sm rounded-xl px-3 py-3 focus:border-yellow-500 outline-none"
                />
            </div>
         </div>

         <div className="mt-8 relative">
            {warning ? (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-400 text-xs font-bold">
                    <AlertTriangle size={18} />
                    {warning}
                </div>
            ) : (
                <div className="bg-slate-950 border border-white/5 rounded-xl p-6 flex flex-col items-center">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-2">{t('rf_trim_amount')}</div>
                    <div className="text-4xl font-black text-yellow-400 font-mono mb-1">
                        {cutAmount ? cutAmount.toFixed(2) : "0.00"} <span className="text-lg text-slate-400">mm</span>
                    </div>
                    <div className="w-px h-8 bg-white/10 my-2"></div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <span>New Length:</span>
                        <span className="text-white font-mono font-bold">{newLength ? newLength.toFixed(2) : "-"} mm</span>
                    </div>
                </div>
            )}
         </div>
         <div className="mt-6 text-[10px] text-slate-400 text-center leading-relaxed">
            <p><strong>{t('instructions_label')}</strong> {t('rf_trim_instructions')}</p>
         </div>
      </div>
    </div>
  );
};