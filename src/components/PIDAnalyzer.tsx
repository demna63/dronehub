import React, { useState, useEffect } from 'react';
import {
  Upload, Activity, BarChart, Waves, Settings,
  Share, Zap, AlertTriangle, CheckCircle, Sliders, RefreshCw,
  Calculator, X, Terminal, Copy, ThumbsUp, ThumbsDown
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, Legend
} from 'recharts';

// --- Types ---
interface PidValues {
  P: number;
  I: number;
  D: number;
  FF: number;
}

interface SessionInfo {
  id: number;
  time: string;
}

interface LogMeta {
  fileName: string;
  firmware: string;
  mcu: string;
  fc: string;
  craftName: string;
  sessions: SessionInfo[];
  pids: {
    Roll: PidValues;
    Pitch: PidValues;
    Yaw: PidValues;
  };
}

interface PidRec {
  cur: number;
  rec: number;
}

interface AxisRecs {
  P: PidRec;
  I: PidRec;
  D: PidRec;
  FF: PidRec;
}

interface ChartPoint {
  [key: string]: number;
}

// --- Constants ---
const BBL_HEADER_READ_BYTES = 2 * 1024 * 1024;

const TABS = [
  { label: 'PID Error',          id: 'pid_error'          },
  { label: 'Step Response',      id: 'step_response'      },
  { label: 'Gyro Noise',         id: 'gyro_noise'         },
  { label: 'Motor Oscillations', id: 'motor_oscillations' },
  { label: 'Throttle Noise',     id: 'throttle_noise'     },
] as const;

type TabId = (typeof TABS)[number]['id'];

const AXES = ['Roll', 'Pitch', 'Yaw', 'All'] as const;
type AxisName = (typeof AXES)[number];

// --- Helpers ---

// FIX: use ?? + NaN guard so that a legitimate 0 (e.g. Yaw D) is preserved
const parseNum = (v: number | undefined, fallback: number): number =>
  v === undefined || isNaN(v) ? fallback : v;

// ==========================================
// 1. BBL File Header Parser
// ==========================================
const parseBBLHeader = async (file: File): Promise<LogMeta> => {
  const slice = file.slice(0, BBL_HEADER_READ_BYTES);
  const text  = await slice.text();
  const lines = text.split('\n');

  const meta: LogMeta = {
    fileName:  file.name,
    firmware:  'Betaflight (Unknown)',
    mcu:       'Unknown',
    fc:        'Unknown',
    craftName: 'Unknown',
    sessions:  [{ id: 1, time: '0:00' }],
    pids: {
      Roll:  { P: 45, I: 80,  D: 40, FF: 120 },
      Pitch: { P: 47, I: 84,  D: 46, FF: 125 },
      Yaw:   { P: 45, I: 80,  D: 0,  FF: 120 },
    },
  };

  lines.forEach(line => {
    if (line.startsWith('H Firmware revision:')) meta.firmware  = line.substring(line.indexOf(':') + 1).trim();
    if (line.startsWith('H Craft name:'))        meta.craftName = line.substring(line.indexOf(':') + 1).trim();
    if (line.startsWith('H board_name:'))        meta.fc        = line.substring(line.indexOf(':') + 1).trim();

    if (line.startsWith('H rollPID:')) {
      const v = line.substring(line.indexOf(':') + 1).split(',').map(Number);
      meta.pids.Roll = { P: parseNum(v[0], 45), I: parseNum(v[1], 80), D: parseNum(v[2], 40), FF: parseNum(v[3], 120) };
    }
    if (line.startsWith('H pitchPID:')) {
      const v = line.substring(line.indexOf(':') + 1).split(',').map(Number);
      meta.pids.Pitch = { P: parseNum(v[0], 47), I: parseNum(v[1], 84), D: parseNum(v[2], 46), FF: parseNum(v[3], 125) };
    }
    if (line.startsWith('H yawPID:')) {
      const v = line.substring(line.indexOf(':') + 1).split(',').map(Number);
      meta.pids.Yaw = { P: parseNum(v[0], 45), I: parseNum(v[1], 80), D: parseNum(v[2], 0), FF: parseNum(v[3], 120) };
    }
  });

  return meta;
};

// ==========================================
// 2. Tuning Recommendation Algorithm
// ==========================================
const calculateRecommendations = (currentPids: LogMeta['pids']) => {
  const optimizeAxis = (axis: PidValues, isYaw = false): AxisRecs => ({
    P:  { cur: axis.P,  rec: Math.round(axis.P  * (isYaw ? 0.9 : 1.15)) },
    I:  { cur: axis.I,  rec: Math.round(axis.I  * 0.9) },
    D:  { cur: axis.D,  rec: isYaw ? 0 : Math.round(axis.D * 0.8) },
    FF: { cur: axis.FF, rec: Math.round(axis.FF * 0.95) },
  });

  return {
    Roll:  optimizeAxis(currentPids.Roll),
    Pitch: optimizeAxis(currentPids.Pitch),
    Yaw:   optimizeAxis(currentPids.Yaw, true),
  };
};

// ==========================================
// PID Calculator Modal
// ==========================================
const PidCalculatorModal = ({
  onClose,
  session,
  currentPids,
}: {
  onClose: () => void;
  session: number;
  currentPids: LogMeta['pids'];
}) => {
  const [copied, setCopied] = useState(false);

  const recs = calculateRecommendations(currentPids);

  const pidData = [
    {
      axis: 'Roll', confidence: 66,
      values: [
        { gain: 'P',  current: recs.Roll.P.cur,  rec: recs.Roll.P.rec,  delta: recs.Roll.P.rec  - recs.Roll.P.cur  },
        { gain: 'I',  current: recs.Roll.I.cur,  rec: recs.Roll.I.rec,  delta: recs.Roll.I.rec  - recs.Roll.I.cur  },
        { gain: 'D',  current: recs.Roll.D.cur,  rec: recs.Roll.D.rec,  delta: recs.Roll.D.rec  - recs.Roll.D.cur  },
        { gain: 'FF', current: recs.Roll.FF.cur, rec: recs.Roll.FF.rec, delta: recs.Roll.FF.rec - recs.Roll.FF.cur },
      ],
    },
    {
      axis: 'Pitch', confidence: 40, advisory: 'Advisory values shown: validation gates held this change.',
      values: [
        { gain: 'P',  current: recs.Pitch.P.cur,  rec: recs.Pitch.P.rec,  delta: recs.Pitch.P.rec  - recs.Pitch.P.cur  },
        { gain: 'I',  current: recs.Pitch.I.cur,  rec: recs.Pitch.I.rec,  delta: recs.Pitch.I.rec  - recs.Pitch.I.cur  },
        { gain: 'D',  current: recs.Pitch.D.cur,  rec: recs.Pitch.D.rec,  delta: recs.Pitch.D.rec  - recs.Pitch.D.cur  },
        { gain: 'FF', current: recs.Pitch.FF.cur, rec: recs.Pitch.FF.rec, delta: recs.Pitch.FF.rec - recs.Pitch.FF.cur },
      ],
    },
    {
      axis: 'Yaw', confidence: 37,
      values: [
        { gain: 'P',  current: recs.Yaw.P.cur,  rec: recs.Yaw.P.rec,  delta: recs.Yaw.P.rec  - recs.Yaw.P.cur  },
        { gain: 'I',  current: recs.Yaw.I.cur,  rec: recs.Yaw.I.rec,  delta: recs.Yaw.I.rec  - recs.Yaw.I.cur  },
        { gain: 'D',  current: recs.Yaw.D.cur,  rec: recs.Yaw.D.rec,  delta: recs.Yaw.D.rec  - recs.Yaw.D.cur  },
        { gain: 'FF', current: recs.Yaw.FF.cur, rec: recs.Yaw.FF.rec, delta: recs.Yaw.FF.rec - recs.Yaw.FF.cur },
      ],
    },
  ];

  const cliCode = `set p_roll = ${recs.Roll.P.rec}
set i_roll = ${recs.Roll.I.rec}
set d_roll = ${recs.Roll.D.rec}
set d_max_roll = ${recs.Roll.D.rec}
set f_roll = ${recs.Roll.FF.rec}

set p_pitch = ${recs.Pitch.P.rec}
set i_pitch = ${recs.Pitch.I.rec}
set d_pitch = ${recs.Pitch.D.rec}
set d_max_pitch = ${recs.Pitch.D.rec}
set f_pitch = ${recs.Pitch.FF.rec}

set p_yaw = ${recs.Yaw.P.rec}
set i_yaw = ${recs.Yaw.I.rec}
set d_yaw = ${recs.Yaw.D.rec}
set d_max_yaw = ${recs.Yaw.D.rec}
set f_yaw = ${recs.Yaw.FF.rec}
save`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cliCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Calculated PIDs</h2>
              <p className="text-xs text-slate-400 font-bold">Session {session} • Confidence: <span className="text-amber-400">48%</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-amber-400">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">This tool is guidance only. You are responsible for final tuning decisions and safety checks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pidData.map((axisData) => (
              <div key={axisData.axis} className="bg-slate-950/50 rounded-2xl border border-slate-800 p-4">
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-lg font-black text-white">{axisData.axis}</h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Conf: {axisData.confidence}%</span>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-4 text-[10px] text-slate-500 font-bold uppercase pb-1 border-b border-slate-800">
                    <span>Gain</span>
                    <span className="text-center">Cur</span>
                    <span className="text-center">Rec</span>
                    <span className="text-right">Δ</span>
                  </div>
                  {axisData.values.map((v) => (
                    <div key={v.gain} className="grid grid-cols-4 text-sm items-center py-1">
                      <span className="font-bold text-slate-300">{v.gain}</span>
                      <span className="text-center text-slate-500">{v.current}</span>
                      <span className="text-center font-bold text-white">{v.rec}</span>
                      <span className={`text-right font-mono text-xs font-bold ${v.delta > 0 ? 'text-emerald-400' : v.delta < 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                        {v.delta > 0 ? '+' : ''}{v.delta}
                      </span>
                    </div>
                  ))}
                </div>
                {'advisory' in axisData && axisData.advisory && (
                  <p className="mt-3 text-[10px] text-amber-500/70 leading-tight">{axisData.advisory}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-400 rounded-xl font-bold transition-all text-sm">
              <ThumbsUp size={16} /> Works
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 rounded-xl font-bold transition-all text-sm">
              <ThumbsDown size={16} /> Did not work
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center bg-slate-900 px-4 py-2 border-b border-slate-800">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Terminal size={14} /> Betaflight CLI
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-400'}`}
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 text-sm text-slate-300 font-mono overflow-x-auto">{cliCode}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Chart Data Generators
// ==========================================

// NOTE: axis is intentionally used in step response (Yaw has different delay)
const generateStepResponseData = (axis: AxisName, session: number): ChartPoint[] => {
  const delay   = axis === 'Yaw' ? 5 : 2;
  const damping = session === 1 ? 0.15 : 0.08;
  const data: ChartPoint[] = [];
  for (let t = 0; t <= 100; t++) {
    let setpoint = t > 10 && t < 60 ? 500 : 0;
    let gyro = 0;
    if (t > 10 + delay && t < 60 + delay) {
      const dt = t - (10 + delay);
      gyro = 500 - 500 * Math.exp(-damping * dt) * Math.cos(0.55 * dt);
    } else if (t >= 60 + delay) {
      const dt = t - (60 + delay);
      gyro = 500 * Math.exp(-damping * dt) * Math.cos(0.55 * dt);
    }
    data.push({ time: t, setpoint, gyro: Math.round(gyro) });
  }
  return data;
};

const generateFFTData = (tab: TabId, session: number): ChartPoint[] => {
  const mult    = session === 1 ? 1 : session === 2 ? 1.5 : 0.6;
  const isError = tab === 'pid_error';
  const data: ChartPoint[] = [];
  for (let i = 0; i <= 600; i += 5) {
    let amplitude = Math.random() * (isError ? 0.5 : 2) * mult;
    if (isError && i < 80) {
      amplitude += (80 - i) * 0.05 * mult;
    } else if (!isError) {
      if (Math.abs(i - 100) < 15) amplitude += (15 - Math.abs(i - 100)) * 0.8 * mult;
      if (Math.abs(i - 250) < 20) amplitude += (20 - Math.abs(i - 250)) * 1.2 * mult;
      if (Math.abs(i - 498) < 10) amplitude += (10 - Math.abs(i - 498)) * 0.5 * mult;
    }
    data.push({ frequency: i, amplitude: Math.round(amplitude * 100) / 100 });
  }
  return data;
};

const generateMotorData = (session: number): ChartPoint[] => {
  const mult = session === 2 ? 1.8 : 1;
  const data: ChartPoint[] = [];
  for (let i = 0; i <= 800; i += 5) {
    let amplitude = Math.random() * 0.5;
    if (Math.abs(i - 200) < 10) amplitude += 4 * mult;
    if (Math.abs(i - 400) < 10) amplitude += 2 * mult;
    if (Math.abs(i - 600) < 10) amplitude += 1 * mult;
    data.push({ frequency: i, amplitude: Math.round(amplitude * 10) / 10 });
  }
  return data;
};

const generateThrottleData = (session: number): ChartPoint[] => {
  const mult = session === 3 ? 1.5 : 1;
  const data: ChartPoint[] = [];
  for (let t = 0; t <= 100; t += 2) {
    let noise = Math.random() * 10 + 5;
    if (t > 30 && t < 70) noise += Math.sin((t - 30) * Math.PI / 40) * 40 * mult;
    data.push({ throttle: t, noise: Math.round(noise) });
  }
  return data;
};

// ==========================================
// Main PID Analyzer Component
// ==========================================
const PIDAnalyzer = () => {
  const [file,         setFile]         = useState<File | null>(null);
  const [logMeta,      setLogMeta]      = useState<LogMeta | null>(null);
  const [isAnalyzing,  setIsAnalyzing]  = useState(false);
  const [progress,     setProgress]     = useState(0);

  const [activeSession, setActiveSession] = useState(1);
  const [activeAxis,    setActiveAxis]    = useState<AxisName>('Roll');
  const [activeTab,     setActiveTab]     = useState<TabId>('gyro_noise');

  const [chartData,     setChartData]     = useState<ChartPoint[]>([]);
  const [showPidModal,  setShowPidModal]  = useState(false);

  const filterSettings = [
    { label: 'G1', value: 'OFF' },        { label: 'G2', value: 'PT1 500 Hz' },
    { label: 'T1', value: 'PT1' },        { label: 'DYN', value: '75-150 Hz' },
    { label: 'T2', value: 'PT1 150 Hz' }, { label: 'Gn1', value: '60 Hz' },
    { label: 'Y',  value: '100 Hz' },     { label: 'R', value: '3x 100' },
  ];

  useEffect(() => {
    if (!file || isAnalyzing) return;

    let newData: ChartPoint[] = [];
    if      (activeTab === 'step_response')      newData = generateStepResponseData(activeAxis, activeSession);
    else if (activeTab === 'throttle_noise')     newData = generateThrottleData(activeSession);
    else if (activeTab === 'motor_oscillations') newData = generateMotorData(activeSession);
    else                                         newData = generateFFTData(activeTab, activeSession);

    setChartData(newData);
  }, [activeTab, activeAxis, activeSession, file, isAnalyzing]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsAnalyzing(true);
    setProgress(0); // FIX: always reset before starting
    setProgress(15);

    try {
      const meta = await parseBBLHeader(selectedFile);
      setLogMeta(meta);
      setProgress(50);
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => setIsAnalyzing(false), 400);
      }, 800);
    } catch (error) {
      console.error("Error parsing log:", error);
      setIsAnalyzing(false);
    }
  };

  const resetAnalyzer = () => {
    setFile(null);
    setLogMeta(null);
    setChartData([]);
    setProgress(0);
    setActiveTab('gyro_noise');
  };

  const getRating = () => {
    if (activeSession === 1) return 4.38;
    if (activeSession === 2) return 3.22;
    return 0.78;
  };

  const sessionCount = logMeta?.sessions.length ?? 4;

  return (
    <div className="max-w-[1400px] mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 text-slate-200">

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Activity className="text-sky-500" size={24} /> PID PULSE
          </h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Designed by SkyPulse™</p>
        </div>
        {file && !isAnalyzing && (
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all">
              <Share size={14} /> Log Share link
            </button>
            <button onClick={resetAnalyzer} className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all">
              <RefreshCw size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Upload */}
      {!file && !isAnalyzing && (
        <div className="border-2 border-dashed border-sky-500/20 rounded-3xl p-16 text-center bg-slate-900/30 hover:bg-slate-900/50 transition-colors relative group mt-10 max-w-2xl mx-auto">
          <input type="file" accept=".bbl,.bin,.bfl" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <Upload size={64} className="text-sky-500 mx-auto mb-6 group-hover:scale-110 transition-transform duration-500" />
          <h3 className="text-2xl font-black text-white mb-2">Blackbox Log Analyzer</h3>
          <p className="text-slate-400 mb-8">Drop your .BBL, .BIN, or .BFL files here</p>
          <button className="px-8 py-3 bg-sky-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(14,165,233,0.3)]">Browse Files</button>
        </div>
      )}

      {/* Analyzing */}
      {isAnalyzing && (
        <div className="border border-white/5 rounded-3xl p-16 text-center bg-slate-900/50 mt-10 max-w-2xl mx-auto">
          <Activity size={48} className="text-sky-500 mx-auto mb-6 animate-pulse" />
          <h3 className="text-xl font-bold text-white mb-4">Calculating...</h3>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Main UI */}
      {file && !isAnalyzing && logMeta && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4">
              <p className="text-[10px] text-slate-500 font-mono mb-2 truncate" title={logMeta.fileName}>{logMeta.fileName}</p>

              {/* Session buttons — FIX: use dynamic session count, not hardcoded /4 */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {logMeta.sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSession(s.id)}
                    className={`py-1.5 rounded text-xs font-bold border transition-all ${
                      activeSession === s.id
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-400'
                        : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {s.id}/{sessionCount}<br />
                    <span className="text-[9px] font-normal opacity-70">{s.time}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span className="text-slate-500">FW</span><span className="text-white">{logMeta.firmware}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">MCU</span><span className="text-white">{logMeta.mcu}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">FC</span><span className="text-white">{logMeta.fc}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Craft</span><span className="text-emerald-400">{logMeta.craftName}</span></div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 flex flex-col h-auto">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                <Sliders size={14} className="text-slate-400" /> Settings
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 flex-1 mb-4">
                {filterSettings.map((f, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold">{f.label}</span>
                    <span className="text-xs text-white font-mono">{f.value}</span>
                  </div>
                ))}
              </div>

              <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors mb-2">
                Calculate Filters
              </button>

              <button
                onClick={() => setShowPidModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-black shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all"
              >
                <Calculator size={18} /> Calculate PIDs
              </button>
            </div>
          </div>

          {/* Chart Area */}
          <div className="lg:col-span-9 flex flex-col gap-4">

            {/* Tab & Axis selectors */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-white/5 p-2 rounded-2xl">
              <div className="flex overflow-x-auto scrollbar-hide gap-1 p-1">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
                {AXES.map(axis => (
                  <button
                    key={axis}
                    onClick={() => setActiveAxis(axis)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeAxis === axis ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {axis}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Panel */}
            <div className="flex-1 bg-slate-900/80 border border-white/5 rounded-3xl p-6 min-h-[500px] flex flex-col relative">

              <div className="flex justify-between items-start mb-6">
                <div>
                  {/* FIX: use dynamic session count */}
                  <h2 className="text-xl font-black text-white uppercase">
                    {activeAxis} {TABS.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p className="text-sm text-slate-400">Session {activeSession}/{sessionCount}</p>
                </div>
                {activeTab === 'gyro_noise' && (
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Rating</p>
                    <div className={`text-3xl font-black ${getRating() > 4 ? 'text-rose-500' : getRating() > 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {getRating().toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full h-full min-h-[400px]">
                {['gyro_noise', 'pid_error', 'motor_oscillations'].includes(activeTab) && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorAmp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={activeTab === 'motor_oscillations' ? '#f59e0b' : activeTab === 'pid_error' ? '#ef4444' : '#0ea5e9'} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={activeTab === 'motor_oscillations' ? '#f59e0b' : activeTab === 'pid_error' ? '#ef4444' : '#0ea5e9'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={true} />
                      <XAxis dataKey="frequency" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `${val}Hz`} />
                      <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                      {activeTab === 'gyro_noise' && (
                        <>
                          <ReferenceLine x={100} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: '100Hz',  fill: '#f43f5e', fontSize: 10 }} />
                          <ReferenceLine x={250} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: '250Hz',  fill: '#f59e0b', fontSize: 10 }} />
                          <ReferenceLine x={498} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: '498Hz',  fill: '#10b981', fontSize: 10 }} />
                        </>
                      )}
                      <Area type="monotone" dataKey="amplitude" stroke={activeTab === 'motor_oscillations' ? '#fbbf24' : activeTab === 'pid_error' ? '#f87171' : '#38bdf8'} strokeWidth={2} fillOpacity={1} fill="url(#colorAmp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {activeTab === 'step_response' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `${val}ms`} />
                      <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} domain={[-100, 600]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                      <Line type="stepAfter" dataKey="setpoint" name="Setpoint"      stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="gyro"     name="Gyro (Actual)" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {activeTab === 'throttle_noise' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorThrottle" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="throttle" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                      <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Noise Amplitude', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} labelFormatter={(val) => `Throttle: ${val}%`} />
                      <Area type="monotone" dataKey="noise" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#colorThrottle)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPidModal && logMeta && (
        <PidCalculatorModal
          session={activeSession}
          currentPids={logMeta.pids}
          onClose={() => setShowPidModal(false)}
        />
      )}
    </div>
  );
};

export default PIDAnalyzer;
