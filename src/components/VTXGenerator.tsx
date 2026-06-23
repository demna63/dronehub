import React, { useState, useMemo, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { 
  Copy, CheckCircle2, Terminal, Table, Settings, Info, Signal, 
  Cpu, ToggleLeft, Radio, ArrowDown, AlertTriangle, Send, 
  Link as LinkIcon, Unlink, Search 
} from 'lucide-react';
import {
  VTX_TEMPLATES,
  VTX_AUX_CHANNELS,
  VTX_ALL_BANDS,
  VTX_PRESETS_DATA,
  SERIAL_PORTS,
  VTX_PROTOCOLS,
  VTX_DEFAULT_CHANNELS_OPTIONS
} from '../constants/toolsData';

// --- Types ---
export interface PowerLevel {
  index: number;
  label: string;
  value: number;
}

// --- Constants ---
const PROTOCOL_MASKS: Record<string, number> = {
  "IRC Tramp": 8192,
  "TBS SmartAudio": 2048,
  "MSP": 0,
};

const PWM_RANGES = {
  LOW:  { from: 900,  to: 1100 },
  MID:  { from: 1400, to: 1600 },
  HIGH: { from: 1900, to: 2100 },
};

// PWM ranges for 3-position band switch
const THREE_BAND_RANGES = [
  { from: 900,  to: 1100 },
  { from: 1400, to: 1600 },
  { from: 1900, to: 2100 },
];

// PWM ranges for 6-position band switch
const SIX_BAND_RANGES = [
  { from: 950,  to: 1050 },
  { from: 1225, to: 1325 },
  { from: 1375, to: 1475 },
  { from: 1525, to: 1625 },
  { from: 1675, to: 1775 },
  { from: 1950, to: 2050 },
];

const DEFAULT_POWER_LEVELS: PowerLevel[] = [
  { index: 1, label: "25",  value: 14 },
  { index: 2, label: "200", value: 20 },
  { index: 3, label: "400", value: 26 },
  { index: 4, label: "600", value: 29 },
];

// Default band positions: R, A, B, E, F, L
const DEFAULT_BAND_STATES = ["5", "1", "2", "3", "4", "6"];

// --- Helpers ---
const formatBandName = (name: string): string => {
  const formatted = name.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_').replace(/[()]/g, '');
  const aliases: Record<string, string> = {
    'BAND_A': 'BOSCAM_A',
    'BAND_B': 'BOSCAM_B',
    'BAND_E': 'BOSCAM_E',
    'BAND_F': 'FATSHARK',
    'BAND_R': 'RACEBAND',
  };
  return aliases[formatted] ?? formatted;
};

const getBandLetter = (name: string): string => {
  if (name.includes("1.3G")) return "1";
  if (name.includes("3.3G")) return "3";
  if (name.toLowerCase().includes("low")) return "L";
  return name.replace(/Band\s+/i, '').charAt(0).toUpperCase();
};

const buildSerialLine = (port: string, proto: string): string => {
  const uartNum = parseInt(port.replace(/\D/g, '')) || 1;
  const mask    = PROTOCOL_MASKS[proto] ?? 8192;
  return `serial ${uartNum - 1} ${mask} 115200 57600 0 115200`;
};

const buildVtxTable = (activeBands: typeof VTX_ALL_BANDS, levels: PowerLevel[]): string => {
  const lines: string[] = [
    `vtxtable bands ${activeBands.length}`,
    `vtxtable channels 8`,
  ];

  activeBands.forEach((band, idx) => {
    const freqs = band.channels.map(ch => ch.freq).slice(0, 8);
    while (freqs.length < 8) freqs.push(0);
    
    // Use proper helpers instead of type suppression
    const bandName   = formatBandName(band.name);
    const bandLetter = getBandLetter(band.name);

    lines.push(
      `vtxtable band ${idx + 1} ${bandName} ${bandLetter} CUSTOM ${freqs.join(' ')}`
    );
  });

  const powerValues = levels.map(p => String(p.value)).join(' ');
  const powerLabels = levels.map(p => p.label).join(' ');

  lines.push(
    `vtxtable powerlevels ${levels.length}`,
    `vtxtable powervalues ${powerValues}`,
    `vtxtable powerlabels ${powerLabels}`,
  );

  return lines.join('\n');
};

// ... აქედან გრძელდება ძველი buildVtxSwitching კოდი ...

const buildVtxSwitching = (
  auxChannel: string,
  levels: PowerLevel[],
  midPower: number,
  enableBandSwitching: boolean,
  enableSixBand: boolean,
  bandSwitchAux: string,
  bandStates: string[],
): string => {
  const auxIdx = parseInt(auxChannel.replace(/\D/g, '')) - 1;
  const minPwr = levels[0]?.index ?? 1;
  const maxPwr = levels[levels.length - 1]?.index ?? 1;

  const lines: string[] = [
    `vtx 0 ${auxIdx} 0 0 ${minPwr} ${PWM_RANGES.LOW.from} ${PWM_RANGES.LOW.to}`,
    `vtx 1 ${auxIdx} 0 0 ${midPower} ${PWM_RANGES.MID.from} ${PWM_RANGES.MID.to}`,
    `vtx 2 ${auxIdx} 0 0 ${maxPwr} ${PWM_RANGES.HIGH.from} ${PWM_RANGES.HIGH.to}`,
  ];

  let lineIdx = 3;

  if (enableBandSwitching) {
    const bandAuxIdx = parseInt(bandSwitchAux.replace(/\D/g, '')) - 1;
    const ranges     = enableSixBand ? SIX_BAND_RANGES : THREE_BAND_RANGES;
    const count      = enableSixBand ? 6 : 3;

    for (let i = 0; i < count; i++) {
      const r = ranges[i];
      lines.push(`vtx ${lineIdx++} ${bandAuxIdx} ${bandStates[i] ?? '0'} 0 0 ${r.from} ${r.to}`);
    }
  }

  // Clear remaining unused VTX control lines
  for (let i = lineIdx; i <= 9; i++) {
    lines.push(`vtx ${i} 0 0 0 0 900 900`);
  }

  return lines.join('\n');
};

const getShortBandName = (name: string) => {
  if (name === 'BOSCAM_A') return 'A';
  if (name === 'BOSCAM_B') return 'B';
  if (name === 'BOSCAM_E') return 'E';
  if (name === 'FATSHARK') return 'FS';
  if (name === 'RACEBAND') return 'RACE';
  if (name === 'IMD6') return 'IMD6';
  return name.substring(0, 4);
};

const getMwTooltip = (label: string): string => {
  const upper = label.toUpperCase();
  if (upper.endsWith('W')) {
    const val = parseFloat(upper);
    if (!isNaN(val)) {
      return `${val * 1000} mW`;
    }
  }
  return `${label} mW`;
};

// --- Main Component ---
const VTXGenerator: React.FC = () => {
  // Configuration state
  const [searchQuery,       setSearchQuery]       = useState("");
  const [selectedTemplate,  setSelectedTemplate]  = useState<string>(VTX_TEMPLATES[0]);
  const [uartPort,          setUartPort]          = useState(SERIAL_PORTS[5]);
  const [protocol,          setProtocol]          = useState(VTX_PROTOCOLS[0]);
  const [auxChannel,        setAuxChannel]        = useState(VTX_AUX_CHANNELS[2]);  // "AUX 3"
  const [defaultBand,       setDefaultBand]       = useState<string>("1");
  const [defaultChannel,    setDefaultChannel]    = useState<string>("1");

  // Power switching — mid position is user-selectable
  const [powerState2, setPowerState2] = useState(2);

  // Band switching
  const [enableBandSwitching, setEnableBandSwitching] = useState(false);
  const [enableSixBand,       setEnableSixBand]       = useState(false);
  const [bandSwitchAux,       setBandSwitchAux]       = useState(VTX_AUX_CHANNELS[3]);  // "AUX 4"
  const [bandStates,          setBandStates]          = useState<string[]>(DEFAULT_BAND_STATES);

  // Data
  const [selectedBands, setSelectedBands] = useState<string[]>([]);
  const [powerLevels,   setPowerLevels]   = useState<PowerLevel[]>(DEFAULT_POWER_LEVELS);

  // Fuzzy Search Setup
  const fuse = useMemo(() => new Fuse(VTX_TEMPLATES, {
    threshold: 0.4, 
    distance: 100,
    ignoreLocation: true,
  }), []);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return VTX_TEMPLATES;
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, fuse]);

  useEffect(() => {
    if (filteredTemplates.length > 0 && !filteredTemplates.includes(selectedTemplate)) {
      setSelectedTemplate(filteredTemplates[0]);
    }
  }, [filteredTemplates, selectedTemplate]);

  // UI
  const [format, setFormat] = useState<'cli' | 'json'>('cli');
  const [copied, setCopied] = useState(false);

  // Web Serial API
  const [isConnected, setIsConnected] = useState(false);
  const [isSending,   setIsSending]   = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portRef   = useRef<any>(null);  // Web Serial API not in TS stdlib
  const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);

  // Load template preset
  useEffect(() => {
    const preset = VTX_PRESETS_DATA[selectedTemplate] ?? VTX_PRESETS_DATA["Custom / Generic"];
    setPowerLevels(preset.levels);
    setSelectedBands(preset.supported_bands ?? VTX_ALL_BANDS.map(b => b.name));
    setPowerState2(preset.levels.length >= 3 ? Math.ceil(preset.levels.length / 2) : 1);
  }, [selectedTemplate]);

  const activeBands = useMemo(() => VTX_ALL_BANDS.filter(b => selectedBands.includes(b.name)), [selectedBands]);

  useEffect(() => {
    if (parseInt(defaultBand) > activeBands.length) {
      setDefaultBand("1");
    }
  }, [activeBands.length, defaultBand]);

  // --- Output Generator ---
  const generatedOutput = useMemo(() => {
    const selectedBandObj = activeBands[parseInt(defaultBand) - 1];
    const preset = VTX_PRESETS_DATA[selectedTemplate] ?? VTX_PRESETS_DATA["Custom / Generic"];
    const isBandSupported = preset.supported_bands ? preset.supported_bands.includes(selectedBandObj?.name) : true;
    const warning = !isBandSupported ? `WARNING: ${selectedBandObj?.name} is not natively supported by ${selectedTemplate}.` : undefined;

    if (format === 'json') {
      return JSON.stringify({
        description: "VTX Config by DroneHub Georgia",
        warning,
        template: selectedTemplate,
        hardware: {
          serial: uartPort,
          protocol,
          aux_power: auxChannel,
          aux_band: enableBandSwitching ? bandSwitchAux : null,
        },
        defaults: { band: defaultBand, channel: defaultChannel },
        power_levels: powerLevels,
        bands: activeBands.map(b => ({ name: b.name, freqs: b.channels.map(c => c.freq) })),
      }, null, 2);
    }

    return [
      warning ? `# ${warning}` : null,
      `# serial`,
      buildSerialLine(uartPort, protocol),
      ``,
      `# vtxtable (${selectedTemplate})`,
      buildVtxTable(activeBands, powerLevels),
      ``,
      `# vtx switching`,
      buildVtxSwitching(auxChannel, powerLevels, powerState2, enableBandSwitching, enableSixBand, bandSwitchAux, bandStates),
      ``,
      `# master`,
      `set vtx_band = ${defaultBand}`,
      `set vtx_channel = ${defaultChannel}`,
      ``,
      `# Sokhumi and Tskhinvali is Georgia Demna`,
      ``,
      `save`,
    ].filter(line => line !== null).join('\n');
  }, [
    selectedBands, selectedTemplate, format, powerLevels, uartPort, protocol, auxChannel,
    powerState2, defaultBand, defaultChannel,
    enableBandSwitching, enableSixBand, bandSwitchAux, bandStates, activeBands,
  ]);

  // --- Serial API Logic ---
  const connectSerial = async () => {
    if (!('serial' in navigator)) {
      alert("Your browser does not support Web Serial API.");
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      const encoder = new TextEncoderStream();
      encoder.readable.pipeTo(port.writable);
      writerRef.current = encoder.writable.getWriter();
      setIsConnected(true);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e?.name === 'NotFoundError' || e?.message?.includes('No port selected')) {
        console.log('Port selection cancelled by user.');
        return;
      }
      console.error('Serial connect error:', err);
      alert("Failed to connect to serial port: " + (e?.message ?? String(err)));
    }
  };

  const disconnectSerial = async () => {
    try {
      if (writerRef.current) { await writerRef.current.close(); writerRef.current = null; }
      if (portRef.current)   { await portRef.current.close();  portRef.current = null; }
    } finally {
      setIsConnected(false);
    }
  };

  const sendToDrone = async () => {
    if (!writerRef.current) return;
    setIsSending(true);
    try {
      await writerRef.current.write("#\n");
      for (const line of generatedOutput.split('\n')) {
        if (line.trim()) {
          await writerRef.current.write(line + "\n");
          await new Promise<void>(r => setTimeout(r, 10));
        }
      }
      alert("Config sent!");
    } catch {
      alert("Error sending config.");
    } finally {
      setIsSending(false);
      disconnectSerial();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleBand = (bandName: string) => {
    setSelectedBands(prev =>
      prev.includes(bandName) ? prev.filter(b => b !== bandName) : [...prev, bandName]
    );
  };

  const setBandState = (index: number, value: string) => {
    setBandStates(prev => prev.map((s, i) => (i === index ? value : s)));
  };

  const bandPositions = (enableSixBand ? [0, 1, 2, 3, 4, 5] : [0, 1, 2])
    .map(i => ({ index: i, label: `Pos ${i + 1}` }));

  // --- Render ---
  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 w-full overflow-x-hidden">

      {/* Header */}
      <div className="text-center space-y-2 border-b border-white/10 pb-6 pt-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-2">
          <Table size={24} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter">
          VTX <span className="text-cyan-400">გენერატორი</span>
        </h1>
        <p className="text-slate-400 text-xs max-w-xl mx-auto px-4">
          Betaflight VTX ცხრილის და კონტროლის გენერატორი.
        </p>
      </div>

      {/* Settings */}
      <div className="space-y-4">

        {/* Row 1: Model, Hardware, Defaults */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* 1. VTX Model */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-lg">
            <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Settings size={12} /> 1. VTX მოდელი
            </h3>
            <div className="space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="მოძებნეთ VTX მოდელი..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-cyan-500 outline-none placeholder:text-slate-500"
                />
              </div>
              <select
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 focus:border-cyan-500 outline-none cursor-pointer hover:bg-slate-800 appearance-none"
              >
                {filteredTemplates.map((t, i) => <option key={i} value={t}>{t}</option>)}
                {filteredTemplates.length === 0 && <option disabled>მოდელები ვერ მოიძებნა</option>}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {!VTX_PRESETS_DATA[selectedTemplate] && (
                <div className="w-full flex items-center gap-2 text-[9px] text-amber-500 mb-1">
                  <AlertTriangle size={10} /> <span>გამოიყენება ზოგადი სიმძლავრის დონეები</span>
                </div>
              )}
              {powerLevels.map((p, i) => (
                <span key={i} title={getMwTooltip(p.label)} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400 border border-white/5 cursor-help">{p.label}</span>
              ))}
            </div>
          </div>

          {/* 2. Hardware */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-lg">
            <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Cpu size={12} /> 2. აპარატურა
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-slate-400 block mb-1 font-bold">სერიული (UART)</label>
                <select value={uartPort} onChange={e => setUartPort(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-2 py-2 appearance-none">
                  {SERIAL_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1 font-bold">პროტოკოლი</label>
                <select value={protocol} onChange={e => setProtocol(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-2 py-2 appearance-none">
                  {VTX_PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Defaults */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-lg">
            <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Radio size={12} /> 3. ნაგულისხმევი პარამეტრები
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[9px] text-slate-400 block mb-1 font-bold">დიაპაზონი</label>
                <select value={defaultBand} onChange={e => setDefaultBand(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-2 py-2 appearance-none">
                  {activeBands.map((b, idx) => <option key={b.name} value={(idx + 1).toString()}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1 font-bold">არხი</label>
                <select value={defaultChannel} onChange={e => setDefaultChannel(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-2 py-2 appearance-none">
                  {VTX_DEFAULT_CHANNELS_OPTIONS.map(c => <option key={c} value={c.toString()}>CH {c}</option>)}
                </select>
              </div>
            </div>
            {/* Validation Message */}
            {(() => {
              const selectedBandObj = activeBands[parseInt(defaultBand) - 1];
              const selectedFreq = selectedBandObj?.channels[parseInt(defaultChannel) - 1]?.freq;
              const preset = VTX_PRESETS_DATA[selectedTemplate] ?? VTX_PRESETS_DATA["Custom / Generic"];
              const isBandSupported = preset.supported_bands ? preset.supported_bands.includes(selectedBandObj?.name) : true;
              
              if (!selectedBandObj) return null;

              return (
                <div className={`p-2 rounded border text-[10px] flex items-start gap-2 ${isBandSupported ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                  {isBandSupported ? <CheckCircle2 size={12} className="mt-0.5 shrink-0" /> : <AlertTriangle size={12} className="mt-0.5 shrink-0" />}
                  <div>
                    <span className="font-bold block mb-0.5">სიხშირე: {selectedFreq ? `${selectedFreq} MHz` : 'უცნობია'}</span>
                    {!isBandSupported && (
                      <span className="opacity-80">გაფრთხილება: {selectedBandObj.name} არ არის მხარდაჭერილი {selectedTemplate}-ის მიერ. ამან შეიძლება გამოიწვიოს პრობლემები.</span>
                    )}
                    {isBandSupported && (
                      <span className="opacity-80">ვალიდური სიხშირე {selectedTemplate}-ისთვის.</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Row 2: Power & Band Switching */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* 4. Power Switching */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <ToggleLeft size={12} /> 4. სიმძლავრის გადამრთველი
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-400 font-bold">AUX:</span>
                <select value={auxChannel} onChange={e => setAuxChannel(e.target.value)} className="bg-slate-950 border border-white/10 text-white text-[10px] rounded px-2 py-1 appearance-none">
                  {VTX_AUX_CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Low */}
              <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5 flex flex-col justify-center" title={powerLevels[0] ? getMwTooltip(powerLevels[0].label) : undefined}>
                <span className="text-[9px] uppercase font-bold text-emerald-500 block text-center mb-1">დაბალი (მინ)</span>
                <div className="h-[28px] flex items-center justify-center">
                  <span className="text-white text-xs font-bold cursor-help">{powerLevels[0]?.label ?? '-'}</span>
                </div>
                <span className="text-[8px] text-slate-400 block text-center mt-1">900–1100</span>
              </div>
              {/* Mid */}
              <div className="bg-slate-900 p-2 rounded-lg border border-white/5 shadow-inner flex flex-col justify-center" title={powerLevels.find(p => p.index === powerState2) ? getMwTooltip(powerLevels.find(p => p.index === powerState2)!.label) : undefined}>
                <span className="text-[9px] uppercase font-bold text-orange-500 block text-center mb-1">საშუალო</span>
                <select value={powerState2} onChange={e => setPowerState2(Number(e.target.value))} className="w-full bg-slate-900 border border-white/10 text-white text-xs rounded px-1 sm:px-2 py-1 h-[28px] outline-none appearance-none text-center cursor-help">
                  {powerLevels.map((p, i) => <option key={i} value={p.index} title={getMwTooltip(p.label)}>{p.label}</option>)}
                </select>
                <span className="text-[8px] text-slate-400 block text-center mt-1">1400–1600</span>
              </div>
              {/* High */}
              <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5 flex flex-col justify-center" title={powerLevels[powerLevels.length - 1] ? getMwTooltip(powerLevels[powerLevels.length - 1].label) : undefined}>
                <span className="text-[9px] uppercase font-bold text-rose-500 block text-center mb-1">მაღალი (მაქს)</span>
                <div className="h-[28px] flex items-center justify-center">
                  <span className="text-white text-xs font-bold cursor-help">{powerLevels[powerLevels.length - 1]?.label ?? '-'}</span>
                </div>
                <span className="text-[8px] text-slate-400 block text-center mt-1">1900–2100</span>
              </div>
            </div>
          </div>

          {/* 5. Band Switching */}
          <div className={`bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-lg transition-all ${enableBandSwitching ? 'opacity-100 ring-1 ring-cyan-500/30' : 'opacity-60'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableBandSwitching}
                  onChange={e => setEnableBandSwitching(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <Signal size={12} /> 5. დიაპაზონის გადამრთველი
                </h3>
              </div>
              {enableBandSwitching && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400 font-bold">AUX:</span>
                  <select value={bandSwitchAux} onChange={e => setBandSwitchAux(e.target.value)} className="bg-slate-950 border border-white/10 text-white text-[10px] rounded px-2 py-1 appearance-none">
                    {VTX_AUX_CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="col-span-full mb-2 flex items-center gap-2 bg-black/20 p-2 rounded-lg">
                <input
                  type="checkbox"
                  checked={enableSixBand}
                  onChange={e => setEnableSixBand(e.target.checked)}
                  disabled={!enableBandSwitching}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-300">6-დიაპაზონიანი რეჟიმის ჩართვა</span>
              </div>
              {bandPositions.map(({ index, label }) => (
                <div key={index} className="bg-slate-950/50 p-2 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[9px] uppercase font-black text-slate-500 block text-center tracking-widest">პოზიცია {index + 1}</span>
                  <div className="grid grid-cols-3 gap-1 mt-2">
                    {activeBands.map((b, i) => {
                      const isSelected = bandStates[index] === (i + 1).toString();
                      return (
                        <button
                          key={b.name}
                          onClick={() => setBandState(index, (i + 1).toString())}
                          disabled={!enableBandSwitching}
                          title={b.name}
                          className={`text-[9px] py-1 rounded transition-all border ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                              : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          } ${!enableBandSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {getShortBandName(b.name)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Bands Toggle */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-lg">
          <details>
            <summary className="text-[10px] font-bold text-slate-400 cursor-pointer hover:text-cyan-400 transition-colors flex items-center gap-1 outline-none">
              <Settings size={10} /> აქტიური დიაპაზონების მართვა ({selectedBands.length}) <ArrowDown size={10} />
            </summary>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {VTX_ALL_BANDS.map(band => (
                <button
                  key={band.name}
                  onClick={() => toggleBand(band.name)}
                  className={`text-[9px] px-2 py-2 sm:py-1 rounded border transition-all ${
                    selectedBands.includes(band.name)
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-950 border-white/5 text-slate-400'
                  }`}
                >
                  {band.name}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Generated Output */}
      <div className="flex flex-col h-full mt-6">
        <div className="flex-1 bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden flex flex-col relative shadow-2xl min-h-[400px]">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-3 sm:px-4 py-3 bg-white/[0.02] border-b border-white/5 gap-3">
            <div className="flex items-center gap-2">
              <Terminal className="text-slate-400" size={14} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Generated Output
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
              <div className="flex gap-2 w-full sm:w-auto">
                {isConnected ? (
                  <button onClick={disconnectSerial} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 py-2 sm:py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-600/30 text-[10px] font-bold transition-all">
                    <Unlink size={12} /> Disconnect
                  </button>
                ) : (
                  <button onClick={connectSerial} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 py-2 sm:py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-600/30 text-[10px] font-bold transition-all">
                    <LinkIcon size={12} /> Connect
                  </button>
                )}

                <button
                  onClick={sendToDrone}
                  disabled={!isConnected || isSending}
                  className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 py-2 sm:py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    isConnected
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSending ? <Cpu size={12} className="animate-spin" /> : <Send size={12} />}
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/5">
                  <button onClick={() => setFormat('cli')} className={`px-3 py-1.5 sm:py-1 rounded-md text-[10px] font-bold transition-all ${format === 'cli' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>CLI</button>
                  <button onClick={() => setFormat('json')} className={`px-3 py-1.5 sm:py-1 rounded-md text-[10px] font-bold transition-all ${format === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>JSON</button>
                </div>

                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              </div>
            </div>
          </div>

          {/* Code Output */}
          <pre className="flex-1 p-4 overflow-auto text-[11px] font-mono text-slate-300 leading-relaxed custom-scrollbar selection:bg-cyan-500/30 whitespace-pre-wrap break-all sm:break-normal sm:whitespace-pre">
            {generatedOutput}
          </pre>

          <div className="h-10 bg-gradient-to-t from-[#0d1117] to-transparent absolute bottom-0 left-0 right-0 pointer-events-none" />
        </div>

        <div className="mt-4 flex items-start sm:items-center gap-3 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-cyan-400 text-xs">
          <Info size={16} className="shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            ინსტრუქცია: დააკოპირეთ კოდი და ჩასვით Betaflight CLI-ში, ან გამოიყენეთ <strong>Connect</strong> ღილაკი პირდაპირ გასაგზავნად (საჭიროა Chrome/Edge).
          </p>
        </div>
      </div>
    </div>
  );
};

export default VTXGenerator;