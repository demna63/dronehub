import React, { useState, useEffect, useCallback } from 'react';
import { Ruler, Activity, Target, Scissors, Radio, Check, Copy, Settings, Info, AlertTriangle } from 'lucide-react';

const SPEED_OF_LIGHT = 299792458; 

const FREQ_PRESETS = [
  { label: "TBS/ELRS 915", value: "915", unit: "MHz" },
  { label: "TBS/ELRS 868", value: "868", unit: "MHz" },
  { label: "ELRS 2.4G", value: "2400", unit: "MHz" },
  { label: "Video 5.8G", value: "5800", unit: "MHz" },
  { label: "Video 1.3G", value: "1280", unit: "MHz" },
];

const AntennaTuner: React.FC = () => {
  // === DIPOLE CALCULATOR STATE ===
  const [frequency, setFrequency] = useState<string>("915");
  const [freqUnit, setFreqUnit] = useState<string>("MHz");
  const [diameter, setDiameter] = useState<string>("0"); 
  const [diameterUnit, setDiameterUnit] = useState<string>("mm");
  const [kFactor, setKFactor] = useState<string>("0.9515"); 
  const [autoK, setAutoK] = useState(true); 
  const [antLength, setAntLength] = useState<string>("");
  const [legLength, setLegLength] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // === TRIMMER TOOL STATE ===
  const [targetFreq, setTargetFreq] = useState<string>("915");
  const [measuredFreq, setMeasuredFreq] = useState<string>("890");
  const [currentLength, setCurrentLength] = useState<string>("80");
  const [cutAmount, setCutAmount] = useState<number | null>(null);
  const [newLength, setNewLength] = useState<number | null>(null);
  const [warning, setWarning] = useState<string>("");

  // --- DIPOLE LOGIC ---
  const toHz = (val: number, unit: string) => {
    if (unit === "Hz") return val;
    if (unit === "kHz") return val * 1e3;
    if (unit === "MHz") return val * 1e6;
    if (unit === "GHz") return val * 1e9;
    return val;
  };

  const calculateDipole = useCallback(() => {
    const f = parseFloat(frequency);
    if (isNaN(f) || f <= 0) return;

    const freqHz = toHz(f, freqUnit);
    const lambdaVacuum = SPEED_OF_LIGHT / freqHz;

    let k = parseFloat(kFactor);
    if (autoK) k = 0.9515; // Placeholder for future logic

    const totalLengthM = (lambdaVacuum / 2) * k;
    const legLengthM = totalLengthM / 2;

    setAntLength((totalLengthM * 100).toFixed(2)); 
    setLegLength((legLengthM * 100).toFixed(2));   
  }, [frequency, freqUnit, kFactor, diameter, diameterUnit, autoK]);

  useEffect(() => { calculateDipole(); }, [calculateDipole]);

  // --- TRIMMER LOGIC ---
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
        setWarning("Measured > Target! ანტენა უკვე მოკლეა.");
    } else {
        setWarning("");
    }
  }, [targetFreq, measuredFreq, currentLength]);

  const applyPreset = (preset: typeof FREQ_PRESETS[0]) => {
      setFrequency(preset.value);
      setTargetFreq(preset.value); // ასევე ვაყენებთ ტრიმერშიც
      setFreqUnit("MHz"); // Presets are in MHz for simplicity here
  };

  const copyResult = () => {
      navigator.clipboard.writeText(`Dipole for ${frequency}MHz: Total ${antLength}cm / Leg ${legLength}cm`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="text-center space-y-2 border-b border-white/10 pb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 mb-2">
           <Ruler size={24} />
        </div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter">
           ANTENNA <span className="text-pink-400">BUILDER</span>
        </h1>
        <p className="text-slate-400 text-xs max-w-xl mx-auto">
           ორი ინსტრუმენტი ერთში: გამოთვალეთ იდეალური ზომა და გაასწორეთ რეალური ანტენა.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* === SECTION 1: DIPOLE CALCULATOR === */}
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <div className="bg-pink-500/20 p-1.5 rounded text-pink-400"><Ruler size={16}/></div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Dipole Calculator</h3>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg space-y-5">
                {/* Presets */}
                <div className="flex flex-wrap gap-2">
                    {FREQ_PRESETS.map((p, i) => (
                        <button key={i} onClick={() => applyPreset(p)} className="text-[10px] bg-slate-950 border border-white/10 text-slate-400 hover:text-pink-300 hover:border-pink-500/30 px-2 py-1 rounded transition-colors">
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Frequency</label>
                    <div className="flex gap-2">
                        <input type="number" value={frequency} onChange={(e) => setFrequency(e.target.value)} className="flex-1 bg-slate-950 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-pink-500"/>
                        <select value={freqUnit} onChange={(e) => setFreqUnit(e.target.value)} className="w-20 bg-slate-950 border border-white/10 text-slate-300 text-xs rounded-lg px-2 outline-none">
                            <option value="MHz">MHz</option><option value="GHz">GHz</option>
                        </select>
                    </div>
                </div>

                {/* Visual Result */}
                <div className="relative h-32 bg-slate-950 rounded-xl border border-white/5 flex flex-col items-center justify-center overflow-hidden group">
                    <button onClick={copyResult} className="absolute top-2 right-2 p-1.5 bg-slate-800/80 hover:bg-pink-500 rounded text-white opacity-0 group-hover:opacity-100 transition-all">
                        {copied ? <Check size={12}/> : <Copy size={12}/>}
                    </button>
                    
                    <div className="w-full flex items-center justify-center gap-1">
                        <div className="h-2 bg-emerald-500/50 rounded-l-full w-1/3 relative">
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-emerald-400">{legLength} cm</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-white z-10"></div>
                        <div className="h-2 bg-emerald-500/50 rounded-r-full w-1/3 relative">
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-emerald-400">{legLength} cm</span>
                        </div>
                    </div>
                    <div className="mt-4 border-t border-pink-500/30 w-2/3 flex justify-center pt-1">
                        <span className="text-xs font-bold text-pink-400">Total: {antLength} cm</span>
                    </div>
                </div>
            </div>
        </div>

        {/* === SECTION 2: TRIMMER TOOL === */}
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <div className="bg-yellow-500/20 p-1.5 rounded text-yellow-400"><Scissors size={16}/></div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. SWR Trimmer</h3>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg space-y-5 h-full">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Target (MHz)</label>
                        <input type="number" value={targetFreq} onChange={(e) => setTargetFreq(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-yellow-500"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Measured (MHz)</label>
                        <input type="number" value={measuredFreq} onChange={(e) => setMeasuredFreq(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-yellow-500"/>
                    </div>
                </div>
                
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Current Length (mm)</label>
                    <input type="number" value={currentLength} onChange={(e) => setCurrentLength(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-yellow-500"/>
                </div>

                {/* Trimmer Result */}
                <div className="bg-slate-950 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center min-h-[128px]">
                    {warning ? (
                        <div className="text-rose-400 text-xs font-bold flex items-center gap-2 text-center">
                            <AlertTriangle size={16}/> {warning}
                        </div>
                    ) : (
                        <>
                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">უნდა მოაჭრათ</div>
                            <div className="text-3xl font-black text-yellow-400 font-mono">
                                -{cutAmount ? cutAmount.toFixed(2) : "0.00"} <span className="text-sm text-slate-400">mm</span>
                            </div>
                            <div className="mt-2 text-[10px] text-slate-400">
                                New Length: <span className="text-white font-bold">{newLength ? newLength.toFixed(2) : "-"} mm</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AntennaTuner;