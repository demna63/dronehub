import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Map, Signal, Unlock, Wifi, Activity, Box, 
  ArrowRight, ArrowLeft, Ruler, BatteryCharging, Radio, Loader2, ArrowRightLeft
} from 'lucide-react';

// ✅ Lazy იმპორტები
const ZoneChecker = lazy(() => import('./ZoneChecker'));
const FrequencyUnlocker = lazy(() => import('./FrequencyUnlocker'));
const FresnelCalculator = lazy(() => import('./FresnelCalculator'));
const HarmonicsCalculator = lazy(() => import('./HarmonicsCalculator'));
const STLCatalog = lazy(() => import('./STLCatalog'));
const BatteryCalculator = lazy(() => import('./BatteryCalculator'));
const ChannelTuner = lazy(() => import('./ChannelTuner'));
const AntennaTuner = lazy(() => import('./AntennaTuner'));
const UnitConverter = lazy(() => import('./RFTools').then((module) => ({ default: module.UnitConverter })));

// დატვირთვის ინდიკატორი კომპონენტი
const ToolLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
    <p className="text-slate-400 text-sm font-medium animate-pulse">ინსტრუმენტი იტვირთება...</p>
  </div>
);

const tools = [
  {
    id: 'battery-calc',
    title: 'Battery Calc',
    desc: 'ფრენის დროის და ბატარეის მოხმარების გამომთვლელი.',
    icon: BatteryCharging,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10'
  },
  {
    id: 'channel-tuner',
    title: 'Channel Tuner',
    desc: 'საუკეთესო სიხშირის შერჩევა ვიდეო გადაცემისთვის.',
    icon: Signal,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10'
  },
  {
    id: 'antenna-tuner',
    title: 'Antenna Calc',
    desc: 'ანტენის ზომების გამომთვლელი სიხშირის მიხედვით.',
    icon: Radio,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10'
  },
  {
    id: 'fresnel',
    title: 'Fresnel Zone',
    desc: 'სიგნალის დაბრკოლებების და ზონების კალკულატორი.',
    icon: Ruler,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10'
  },
  {
    id: 'unlocker',
    title: 'VTX Unlocker',
    desc: 'ინსტრუქციები VTX-ის სიხშირეების გასახსნელად.',
    icon: Unlock,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10'
  },
  {
    id: 'harmonics',
    title: 'Harmonics',
    desc: 'სიხშირეების ჰარმონიული ინტერფერენციის შემოწმება.',
    icon: Activity,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10'
  },
  {
    id: 'stl',
    title: 'STL Catalog',
    desc: 'დრონის ნაწილების 3D მოდელები დასაბეჭდად.',
    icon: Box,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  {
    id: 'zone-check',
    title: 'Zone Checker',
    desc: 'ფრენისთვის აკრძალული და ნებადართული ზონები.',
    icon: Map,
    color: 'text-red-400',
    bg: 'bg-red-500/10'
  },
  {
    id: 'converter',
    title: 'RF Converter',
    desc: 'mW/dBm, LiPo voltage და RF ერთეულების კონვერტერი.',
    icon: ArrowRightLeft,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10'
  }
] as const;

const ToolsHub = () => {
  const location = useLocation();
  const isRoot = /^\/tools\/?$/.test(location.pathname);

  // მიმდინარე ინსტრუმენტის სახელის პოვნა "უკან" ღილაკისთვის
  const currentToolId = !isRoot
    ? location.pathname.split('/').filter(Boolean).pop()
    : null;
  const currentTool = currentToolId
    ? tools.find((t) => t.id === currentToolId)
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {isRoot ? (
        <>
          {/* HEADER */}
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase italic flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Wifi className="text-white" size={24} />
              </div>
              FPV Tools Hub
            </h1>
            <p className="text-slate-400 font-medium">
              ყველა საჭირო ხელსაწყო FPV პილოტებისთვის ერთ სივრცეში.
            </p>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.id}
                className="group relative p-6 rounded-2xl bg-slate-900 border border-white/5 hover:border-white/10 transition-all duration-200 hover:-translate-y-1 overflow-hidden"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${tool.bg} flex items-center justify-center ${tool.color} mb-4 group-hover:scale-110 transition-transform duration-500`}
                >
                  <tool.icon size={24} />
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0">
                  <ArrowRight size={20} className="text-slate-400" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{tool.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{tool.desc}</p>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* უკან დაბრუნების ღილაკი */}
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Tools Hub</span>
            {currentTool && (
              <span className="text-slate-600">/</span>
            )}
            {currentTool && (
              <span className="text-slate-300 font-medium">{currentTool.title}</span>
            )}
          </Link>

          {/* ROUTES */}
          <Suspense fallback={<ToolLoader />}>
            <Routes>
              <Route path="battery-calc" element={<BatteryCalculator />} />
              <Route path="antenna-tuner" element={<AntennaTuner />} />
              <Route path="channel-tuner" element={<ChannelTuner />} />
              <Route path="zone-check" element={<ZoneChecker />} />
              <Route path="unlocker" element={<FrequencyUnlocker />} />
              <Route path="fresnel" element={<FresnelCalculator />} />
              <Route path="harmonics" element={<HarmonicsCalculator />} />
              <Route path="stl" element={<STLCatalog />} />
              <Route path="converter" element={<UnitConverter />} />
            </Routes>
          </Suspense>
        </>
      )}
    </div>
  );
};

export default ToolsHub;