import React, { useState, useMemo } from 'react';
import { BatteryCharging, Zap, Info, Clock, Gauge, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';

/** Efficiency factors. The labels are translation keys, resolved at render. */
const BATTERY_TYPES = [
  { labelKey: 'battery_lithium', value: 0.95 },
  { labelKey: 'battery_lead_acid', value: 0.80 },
  { labelKey: 'battery_nimh', value: 0.70 },
  { labelKey: 'battery_custom', value: 1.0 },
];

const BatteryCalculator: React.FC = () => {
  const { t } = useLanguage();
  // --- STATE ---
  const [capacity, setCapacity] = useState<string>("5000"); // mAh default
  const [capacityUnit, setCapacityUnit] = useState<string>("mAh");
  
  const [current, setCurrent] = useState<string>("2.0"); // Amps
  const [currentUnit, setCurrentUnit] = useState<string>("A");
  
  const [soc, setSoc] = useState<string>("20"); // State of Charge %
  const [efficiency, setEfficiency] = useState<number>(0.95); // Default Li-ion

  // UI State
  const [showInfo, setShowInfo] = useState(false);

  // --- CALCULATION (derived, no extra re-render) ---
  const chargeTime = useMemo(() => {
    let capAh = parseFloat(capacity) || 0;
    if (capacityUnit === "mAh") capAh /= 1000;

    let currA = parseFloat(current) || 0;
    if (currentUnit === "mA") currA /= 1000;

    const currentSoc = parseFloat(soc) || 0;

    if (capAh <= 0 || currA <= 0 || efficiency <= 0) return "0h 0m";

    const neededCapacityAh = capAh * (1 - currentSoc / 100);
    const realTimeHours    = (neededCapacityAh / currA) / efficiency;

    let hours   = Math.floor(realTimeHours);
    let minutes = Math.round((realTimeHours - hours) * 60);

    // FIX: floating-point can push minutes to 60
    if (minutes === 60) { hours += 1; minutes = 0; }

    return `${hours}h ${minutes}m`;
  }, [capacity, capacityUnit, current, currentUnit, soc, efficiency]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <h1 className="sr-only">{t('battery_title')}</h1>
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
           <BatteryCharging size={24} />
        </div>
        <div>
           <h2 className="text-xl font-black text-white tracking-tight">Battery Charge Time</h2>
           <p className="text-xs text-slate-400 mt-1">{t('battery_subtitle')}</p>
        </div>
      </div>

      {/* Main Calculator Box */}
      <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Inputs */}
        <div className="flex-1 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Capacity */}
                <div>
                    <label htmlFor="battery-capacity" className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <BatteryCharging size={14} /> Capacity
                    </label>
                    <div className="flex bg-slate-950 border border-white/10 rounded-xl overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                        <input 
                            id="battery-capacity"
                            type="number" 
                            min="0" step="any"
                            value={capacity} 
                            onChange={(e) => setCapacity(e.target.value)}
                            className="w-full bg-transparent text-white px-4 py-3 outline-none font-mono"
                        />
                        <select 
                            aria-label={t('unit_capacity')}
                            value={capacityUnit} 
                            onChange={(e) => setCapacityUnit(e.target.value)}
                            className="bg-white/5 text-slate-300 px-3 outline-none border-l border-white/10 cursor-pointer hover:bg-white/10"
                        >
                            <option value="mAh">mAh</option>
                            <option value="Ah">Ah</option>
                        </select>
                    </div>
                </div>

                {/* Current */}
                <div>
                    <label htmlFor="battery-current" className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <Zap size={14} /> Charge Rate
                    </label>
                    <div className="flex bg-slate-950 border border-white/10 rounded-xl overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                        <input 
                            id="battery-current"
                            type="number" 
                            min="0" step="any"
                            value={current} 
                            onChange={(e) => setCurrent(e.target.value)}
                            className="w-full bg-transparent text-white px-4 py-3 outline-none font-mono"
                        />
                        <select 
                            aria-label={t('unit_charge_current')}
                            value={currentUnit} 
                            onChange={(e) => setCurrentUnit(e.target.value)}
                            className="bg-white/5 text-slate-300 px-3 outline-none border-l border-white/10 cursor-pointer hover:bg-white/10"
                        >
                            <option value="A">A</option>
                            <option value="mA">mA</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* State of Charge (SoC) */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="battery-soc" className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <Gauge size={14} /> Current Charge
                        </label>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{soc}%</span>
                    </div>
                    <div className="bg-slate-950 border border-white/10 rounded-xl p-3 flex items-center h-[50px]">
                        <input
                            id="battery-soc"
                            type="range" min="0" max="100"
                            value={soc} 
                            onChange={(e) => setSoc(e.target.value)}
                            className="w-full accent-emerald-500"
                        />
                    </div>
                </div>

                {/* Efficiency / Type */}
                <div>
                    <label htmlFor="battery-type" className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <Settings size={14} /> Battery Type
                    </label>
                    <select 
                        id="battery-type"
                        value={efficiency} 
                        onChange={(e) => setEfficiency(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-white/10 text-slate-300 px-4 h-[50px] rounded-xl outline-none focus:border-emerald-500/50 cursor-pointer hover:bg-white/[0.02]"
                    >
                        {BATTERY_TYPES.map(type => (
                            <option key={t(type.labelKey)} value={type.value}>{t(type.labelKey)}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {/* Right Side: Result Card */}
        <div className="lg:w-72 bg-gradient-to-br from-emerald-500/10 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock size={100} />
            </div>
            <div className="relative z-10 text-center">
                <p className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest mb-2">Estimated Time</p>
                <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                    {chargeTime.split(' ')[0]} <span className="text-xl text-slate-400"> {chargeTime.split(' ')[1]}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-500/20 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Zap size={12} className="text-emerald-500" />
                    <span>Calculated at {(efficiency * 100).toFixed(0)}% eff.</span>
                </div>
            </div>
        </div>
      </div>

      {/* Info / FAQ Section */}
      <div className="bg-slate-900/30 rounded-2xl border border-white/5 overflow-hidden">
         <button 
            onClick={() => setShowInfo(!showInfo)}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/5 transition-colors"
         >
            <div className="flex items-center gap-3">
               <Info size={18} className="text-sky-400" />
               <span className="font-bold text-slate-300 text-sm">{t('battery_faq_title')}</span>
            </div>
            {showInfo ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
         </button>
         
         {showInfo && (
            <div className="p-5 pt-0 border-t border-white/5 text-sm text-slate-400 leading-relaxed space-y-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                 <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Settings size={16} className="text-slate-500"/>
                    {t('battery_formula')}
                 </h3>
                 <div className="font-mono text-xs bg-slate-900 p-3 rounded-lg border border-white/5 text-emerald-400/80 break-all">
                    Time (h) = (Capacity_Ah * (1 - SoC)) / Charge_Current_A / Efficiency
                 </div>
                 <p className="mt-3 text-xs">რეალობაში დატენვის პროცესი არ არის ხაზოვანი. LiPo/Li-ion ელემენტები იტენება <strong>CC/CV</strong> (Constant Current / Constant Voltage) მეთოდით.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <p className="text-white font-bold mb-1">{t('battery_q_howto')}</p>
                    <p className="text-xs">{t('battery_a_howto')}</p>
                 </div>
                 <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <p className="text-white font-bold mb-1">{t('battery_q_1c')}</p>
                    <p className="text-xs">{t('battery_a_1c')}</p>
                 </div>
              </div>
            </div>
         )}
      </div>

    </div>
  );
};

export default BatteryCalculator;