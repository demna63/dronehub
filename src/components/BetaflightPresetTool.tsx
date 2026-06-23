
import React, { useState, useMemo } from 'react';
import { Database, AlertTriangle, Copy, CheckCircle2, Cpu, Battery, Settings2, Wind, Activity, Zap, Layers } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PresetData {
  p_pitch: number;
  i_pitch: number;
  d_pitch: number;
  f_pitch: number;
  p_roll: number;
  i_roll: number;
  d_roll: number;
  f_roll: number;
  p_yaw: number;
  i_yaw: number;
  d_yaw: number;
  f_yaw: number;
  d_min_roll: number;
  d_min_pitch: number;
  gyro_lpf1_static_hz: number;
  gyro_lpf2_static_hz: number;
  d_lpf1_static_hz: number;
  dyn_notch_q: number;
  comment: string;
  extra_cli?: string;
}

const TUNES: Record<string, Record<string, PresetData>> = {
  'whoop_65': {
    '1s': {
      p_pitch: 65, i_pitch: 85, d_pitch: 60, f_pitch: 120,
      p_roll: 60, i_roll: 80, d_roll: 55, f_roll: 110,
      p_yaw: 65, i_yaw: 85, d_yaw: 0, f_yaw: 110,
      d_min_roll: 40, d_min_pitch: 45,
      gyro_lpf1_static_hz: 0, gyro_lpf2_static_hz: 0, d_lpf1_static_hz: 0, dyn_notch_q: 120,
      comment: 'High PIDs for tiny 65mm throw weight. Filters open (0 = max/dynamic) as 65mm frames are stiff and small props have high frequency noise.'
    }
  },
  'micro_universal': {
    '2s': {
      p_pitch: 47, i_pitch: 84, d_pitch: 34, f_pitch: 125,
      p_roll: 45, i_roll: 80, d_roll: 30, f_roll: 120,
      p_yaw: 45, i_yaw: 80, d_yaw: 0, f_yaw: 120,
      d_min_roll: 40, d_min_pitch: 46,
      gyro_lpf1_static_hz: 250, gyro_lpf2_static_hz: 500, d_lpf1_static_hz: 75, dyn_notch_q: 300,
      comment: 'Universal Micro Tune (2" - 3.5"). Heavy filtering (250Hz/500Hz) to manage vibrations on smaller frames. High Master Multiplier (1.5x) for authority.'
    },
    '3s': {
      p_pitch: 47, i_pitch: 84, d_pitch: 34, f_pitch: 125,
      p_roll: 45, i_roll: 80, d_roll: 30, f_roll: 120,
      p_yaw: 45, i_yaw: 80, d_yaw: 0, f_yaw: 120,
      d_min_roll: 40, d_min_pitch: 46,
      gyro_lpf1_static_hz: 250, gyro_lpf2_static_hz: 500, d_lpf1_static_hz: 75, dyn_notch_q: 300,
      comment: 'Universal Micro Tune (2" - 3.5"). Heavy filtering (250Hz/500Hz) to manage vibrations on smaller frames. High Master Multiplier (1.5x) for authority.'
    },
    '4s': {
      p_pitch: 47, i_pitch: 84, d_pitch: 34, f_pitch: 125,
      p_roll: 45, i_roll: 80, d_roll: 30, f_roll: 120,
      p_yaw: 45, i_yaw: 80, d_yaw: 0, f_yaw: 120,
      d_min_roll: 40, d_min_pitch: 46,
      gyro_lpf1_static_hz: 250, gyro_lpf2_static_hz: 500, d_lpf1_static_hz: 75, dyn_notch_q: 300,
      comment: 'Universal Micro Tune (2" - 3.5"). Heavy filtering (250Hz/500Hz) to manage vibrations on smaller frames. High Master Multiplier (1.5x) for authority.'
    }
  },
  'cinewhoop_3': {
    '4s': {
      p_pitch: 50, i_pitch: 90, d_pitch: 40, f_pitch: 100,
      p_roll: 45, i_roll: 85, d_roll: 38, f_roll: 95,
      p_yaw: 50, i_yaw: 90, d_yaw: 0, f_yaw: 95,
      d_min_roll: 28, d_min_pitch: 30,
      gyro_lpf1_static_hz: 0, gyro_lpf2_static_hz: 500, d_lpf1_static_hz: 150, dyn_notch_q: 200,
      comment: 'Higher I-term for wind resistance (ducts catch wind). Moderate filtering to handle duct vibration.'
    },
    '6s': {
      p_pitch: 45, i_pitch: 90, d_pitch: 38, f_pitch: 95,
      p_roll: 42, i_roll: 85, d_roll: 36, f_roll: 90,
      p_yaw: 50, i_yaw: 90, d_yaw: 0, f_yaw: 95,
      d_min_roll: 26, d_min_pitch: 28,
      gyro_lpf1_static_hz: 0, gyro_lpf2_static_hz: 500, d_lpf1_static_hz: 150, dyn_notch_q: 200,
      comment: 'Scaled down PIDs for 6S voltage authority. Standard filtering.'
    }
  },
  'freestyle_5': {
    '4s': {
      p_pitch: 47, i_pitch: 84, d_pitch: 46, f_pitch: 125,
      p_roll: 45, i_roll: 80, d_roll: 40, f_roll: 120,
      p_yaw: 45, i_yaw: 80, d_yaw: 0, f_yaw: 120,
      d_min_roll: 30, d_min_pitch: 34,
      gyro_lpf1_static_hz: 250, gyro_lpf2_static_hz: 500, d_lpf1_static_hz: 75, dyn_notch_q: 120,
      comment: 'High Performance Freestyle (MM 80). High D-Gains (170) & Feedforward (200) for locked feel. Heavy filtering (Gyro Mult 60) for vibration tolerance. Check motor temps!',
      extra_cli: `set simplified_master_multiplier = 80
set simplified_pi_gain = 100
set simplified_d_gain = 170
set simplified_d_max_gain = 0
set simplified_feedforward_gain = 200
set simplified_pitch_d_gain = 100
set simplified_pitch_pi_gain = 100
set anti_gravity_gain = 80
set pidsum_limit = 1000
set pidsum_limit_yaw = 1000
set simplified_gyro_filter = ON
set simplified_gyro_filter_multiplier = 60
set simplified_dterm_filter = ON
set simplified_dterm_filter_multiplier = 100
set dyn_notch_count = 3
set dyn_notch_min_hz = 125
set dyn_notch_max_hz = 650
set yaw_lowpass_hz = 0
set thrust_linear = 0`
    },
    '5s': {
      p_pitch: 47, i_pitch: 84, d_pitch: 46, f_pitch: 125,
      p_roll: 45, i_roll: 80, d_roll: 40, f_roll: 120,
      p_yaw: 45, i_yaw: 80, d_yaw: 0, f_yaw: 120,
      d_min_roll: 30, d_min_pitch: 34,
      gyro_lpf1_static_hz: 250, gyro_lpf2_static_hz: 500, d_lpf1_static_hz: 75, dyn_notch_q: 120,
      comment: 'High Performance Freestyle (MM 80). High D-Gains (170) & Feedforward (200) for locked feel. Heavy filtering (Gyro Mult 60) for vibration tolerance. Check motor temps!',
      extra_cli: `set simplified_master_multiplier = 80
set simplified_pi_gain = 100
set simplified_d_gain = 170
set simplified_d_max_gain = 0
set simplified_feedforward_gain = 200
set simplified_pitch_d_gain = 100
set simplified_pitch_pi_gain = 100
set anti_gravity_gain = 80
set pidsum_limit = 1000
set pidsum_limit_yaw = 1000
set simplified_gyro_filter = ON
set simplified_gyro_filter_multiplier = 60
set simplified_dterm_filter = ON
set simplified_dterm_filter_multiplier = 100
set dyn_notch_count = 3
set dyn_notch_min_hz = 125
set dyn_notch_max_hz = 650
set yaw_lowpass_hz = 0
set thrust_linear = 0`
    },
    '6s': {
      p_pitch: 46, i_pitch: 85, d_pitch: 36, f_pitch: 105,
      p_roll: 43, i_roll: 80, d_roll: 33, f_roll: 100,
      p_yaw: 45, i_yaw: 80, d_yaw: 0, f_yaw: 100,
      d_min_roll: 23, d_min_pitch: 25,
      gyro_lpf1_static_hz: 0, gyro_lpf2_static_hz: 0, d_lpf1_static_hz: 0, dyn_notch_q: 120,
      comment: 'Standard 5" 6S Tune. PIDs lowered slightly to prevent oscillations at high voltage. Filters open for low latency.'
    }
  },
  'longrange_7': {
    '6s': {
      p_pitch: 38, i_pitch: 65, d_pitch: 26, f_pitch: 60,
      p_roll: 35, i_roll: 60, d_roll: 24, f_roll: 55,
      p_yaw: 40, i_yaw: 70, d_yaw: 0, f_yaw: 60,
      d_min_roll: 15, d_min_pitch: 18,
      gyro_lpf1_static_hz: 0, gyro_lpf2_static_hz: 250, d_lpf1_static_hz: 100, dyn_notch_q: 250,
      comment: 'Significantly reduced P and D terms to prevent mid-throttle oscillations common on flexible 7" arms. Filters tightened.'
    }
  },
  'cinelifter_10': {
    '6s': {
      p_pitch: 25, i_pitch: 50, d_pitch: 18, f_pitch: 40,
      p_roll: 22, i_roll: 45, d_roll: 16, f_roll: 35,
      p_yaw: 35, i_yaw: 55, d_yaw: 0, f_yaw: 40,
      d_min_roll: 10, d_min_pitch: 12,
      gyro_lpf1_static_hz: 200, gyro_lpf2_static_hz: 100, d_lpf1_static_hz: 70, dyn_notch_q: 300,
      comment: 'VERY Conservative Tune. Large props (10") create low-freq noise requiring heavy LPF filtering. Low P/D to prevent dangerous feedback loops.'
    }
  }
};

const DRONE_TYPES = [
  { id: 'whoop_65', label: '65mm Tiny Whoop', icon: Zap, desc: 'Indoor, high KV' },
  { id: 'micro_universal', label: '2" - 3.5" Micro', icon: Layers, desc: 'Toothpick / Micro' },
  { id: 'cinewhoop_3', label: '3" Cinewhoop', icon: Wind, desc: 'Ducted, smooth' },
  { id: 'freestyle_5', label: '5" Freestyle', icon: Activity, desc: 'Acro, responsive' },
  { id: 'longrange_7', label: '7" Long Range', icon: Database, desc: 'Stable, efficient' },
  { id: 'cinelifter_10', label: '10" Cinelifter', icon: Cpu, desc: 'Heavy lift, safe' }
];

const BATTERY_TYPES = [
  { id: '1s', label: '1S (3.8V)', desc: 'Whoop' },
  { id: '2s', label: '2S (7.4V)', desc: 'Micro' },
  { id: '3s', label: '3S (11.1V)', desc: 'Toothpick' },
  { id: '4s', label: '4S (14.8V)', desc: 'Standard' },
  { id: '5s', label: '5S (18.5V)', desc: 'Hybrid' },
  { id: '6s', label: '6S (22.2V)', desc: 'High Voltage' }
];

const BetaflightPresetTool: React.FC = () => {
  const { t } = useLanguage();
  const [selectedDrone, setSelectedDrone] = useState(DRONE_TYPES[3].id);
  const [selectedBattery, setSelectedBattery] = useState('6s');
  const [copied, setCopied] = useState(false);

  const activePreset = useMemo(() => {
    return TUNES[selectedDrone]?.[selectedBattery] || null;
  }, [selectedDrone, selectedBattery]);

  const cliOutput = useMemo(() => {
    if (!activePreset) return "# No preset available for this specific combination.";
    
    const d = activePreset;
    let cli = `# Betaflight 4.4/4.5 Tune
# Class: ${DRONE_TYPES.find(d => d.id === selectedDrone)?.label}
# Power: ${BATTERY_TYPES.find(b => b.id === selectedBattery)?.label}
# NOTE: ${d.comment}

# --- PID Profile ---
set p_pitch = ${d.p_pitch}
set i_pitch = ${d.i_pitch}
set d_pitch = ${d.d_pitch}
set f_pitch = ${d.f_pitch}

set p_roll = ${d.p_roll}
set i_roll = ${d.i_roll}
set d_roll = ${d.d_roll}
set f_roll = ${d.f_roll}

set p_yaw = ${d.p_yaw}
set i_yaw = ${d.i_yaw}
set d_yaw = ${d.d_yaw}
set f_yaw = ${d.f_yaw}

# --- Dynamic Idle & D-Min ---
set d_min_roll = ${d.d_min_roll}
set d_min_pitch = ${d.d_min_pitch}
set dyn_idle_min_rpm = 25

# --- Filters ---
set gyro_lpf1_type = PT1
set gyro_lpf1_static_hz = ${d.gyro_lpf1_static_hz}
set gyro_lpf2_type = PT1
set gyro_lpf2_static_hz = ${d.gyro_lpf2_static_hz}
set d_lpf1_type = PT1
set d_lpf1_static_hz = ${d.d_lpf1_static_hz}
set dyn_notch_count = 3
set dyn_notch_q = ${d.dyn_notch_q}`;

    if (d.extra_cli) {
      cli += `\n\n# --- Advanced Settings (Sliders & Extras) ---\n${d.extra_cli}`;
    }

    cli += `\n\nsave`;
    return cli;
  }, [activePreset, selectedDrone, selectedBattery]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cliOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderCLI = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('#')) return <div key={i} className="text-slate-400 italic">{line}</div>;
      if (!line.trim()) return <div key={i} className="h-4"></div>;
      const parts = line.split('=');
      if (parts.length === 2) {
        return (
          <div key={i}>
            <span className="text-indigo-400 font-bold">{parts[0]}</span>
            <span className="text-slate-400">=</span>
            <span className="text-emerald-400 font-bold">{parts[1]}</span>
          </div>
        );
      }
      if (line === 'save') return <div key={i} className="text-amber-400 font-bold uppercase mt-2">{line}</div>;
      return <div key={i} className="text-slate-300">{line}</div>;
    });
  };

  return (
    <div className="max-w-5xl mx-auto pb-40 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-8">
      
      {/* Header */}
      <div className="bg-slate-900 border border-white/5 rounded-[48px] p-10 md:p-14 mb-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sky-400 mb-2">
               <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
               <span className="text-[10px] font-black uppercase tracking-[0.25em]">{t('bf_eng_db')}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter flex items-center gap-5 leading-none">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <Settings2 className="w-8 h-8" strokeWidth={2.5} />
              </div>
              {t('bf_title')}
            </h1>
            <p className="text-slate-400 font-medium text-sm md:text-base max-w-2xl leading-relaxed border-l-2 border-sky-500/30 pl-6">
              {t('bf_desc')}"
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Controls Column */}
        <div className="bg-slate-900 border border-white/5 rounded-[32px] p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Drone Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Cpu className="w-5 h-5" /></div>
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] typography-mtavruli">{t('bf_build_class')}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {DRONE_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedDrone(type.id)}
                          className={`w-full text-left px-5 py-4 rounded-[20px] border transition-all flex items-center gap-4 group ${
                            selectedDrone === type.id 
                              ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' 
                              : 'bg-slate-950 border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className={`p-2 rounded-xl transition-colors ${selectedDrone === type.id ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-[11px] font-black uppercase tracking-widest leading-tight">{type.label}</span>
                            <span className={`text-[9px] font-bold ${selectedDrone === type.id ? 'text-indigo-200' : 'text-slate-400'}`}>{type.desc}</span>
                          </div>
                          {selectedDrone === type.id && <div className="ml-auto bg-white/20 p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Battery Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400"><Battery className="w-5 h-5" /></div>
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] typography-mtavruli">{t('bf_power_source')}</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BATTERY_TYPES.map(bat => {
                      const isDisabled = !TUNES[selectedDrone]?.[bat.id];
                      return (
                        <button
                          key={bat.id}
                          onClick={() => setSelectedBattery(bat.id)}
                          disabled={isDisabled}
                          className={`flex flex-col items-center justify-center py-4 rounded-[20px] border transition-all gap-1 ${
                            selectedBattery === bat.id 
                              ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/20' 
                              : isDisabled
                                ? 'bg-slate-950/50 border-white/5 text-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-slate-950 border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="text-[11px] font-black uppercase tracking-widest">{bat.label.split(' ')[0]}</span>
                          <span className={`text-[8px] font-bold ${selectedBattery === bat.id ? 'text-sky-200' : 'text-slate-400'}`}>{bat.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
            </div>
        </div>

        {/* Output Column */}
        <div className="space-y-6">
          
          {/* Warning Card */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-[32px] p-6 md:p-8 flex gap-5 items-start">
             <div className="p-3 bg-amber-500/20 text-amber-500 rounded-2xl flex-shrink-0">
               <AlertTriangle className="w-6 h-6" />
             </div>
             <div>
                <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2">{t('bf_warning_title')}</h4>
                <p className="text-[12px] text-amber-100/90 leading-relaxed font-medium">
                  {t('bf_warning_text')}
                  <br className="hidden md:block"/>
                  <span className="text-white font-bold bg-amber-500/20 px-1 rounded">{t('bf_check_temps')}</span> {t('bf_check_temps_desc')}
                </p>
             </div>
          </div>

          {/* CLI Display */}
          <div className="bg-[#0d1117] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative group flex flex-col min-h-[500px]">
             <div className="flex items-center justify-between px-8 py-5 bg-white/[0.02] border-b border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                   <Database className="w-4 h-4 text-slate-400" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('bf_cli_output')}</span>
                </div>
                <button 
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('bf_copied') : t('bf_copy')}
                </button>
             </div>

             <div className="p-8 font-mono text-[13px] overflow-auto custom-scrollbar flex-1 bg-[#0d1117] text-slate-300 leading-relaxed">
               {renderCLI(cliOutput)}
             </div>
             
             {/* Bottom fade for visual aesthetic */}
             <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none"></div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default BetaflightPresetTool;
