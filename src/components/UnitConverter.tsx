import React, { useState } from 'react';
import { RefreshCw, Zap, ArrowRightLeft, Battery, Signal } from 'lucide-react';

const UnitConverter: React.FC = () => {
  // --- mW <-> dBm State ---
  const [mw, setMw] = useState<string>("25");
  const [dbm, setDbm] = useState<string>("14");

  // --- LiPo Voltage State ---
  const [cells, setCells] = useState<number>(4); // 4S, 6S etc.
  
  // Handlers for Power
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
      
      {/* Header */}
      <div className="text-center space-y-2 border-b border-white/10 pb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 mb-2">
           <RefreshCw size={24} />
        </div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter">
           UNIT <span className="text-orange-400">CONVERTER</span>
        </h1>
        <p className="text-slate-400 text-xs max-w-xl mx-auto">
           სწრაფი კონვერტაცია სიმძლავრისა და ვოლტაჟისთვის.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* RF POWER CONVERTER */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                <Signal className="text-orange-400" size={20} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">RF Power (VTX)</h3>
            </div>

            <div className="space-y-6 relative">
                {/* Input 1 */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Milliwatts</label>
                    <div className="relative">
                        <input 
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

                {/* Input 2 */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Decibel-milliwatts</label>
                    <div className="relative">
                        <input 
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
            
            <div className="mt-6 text-[10px] text-slate-400 bg-slate-950/50 p-3 rounded-lg">
                <p>💡 ყოველი <strong>+6 dBm</strong> მანძილს აორმაგებს. (მაგ: 25mW -`{'>'}` 100mW).</p>
            </div>
        </div>

        {/* LIPO VOLTAGE */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                <Battery className="text-emerald-400" size={20} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">LiPo Voltage</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Cell Count (S)</label>
                    <div className="flex flex-wrap gap-2">
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

export default UnitConverter;
