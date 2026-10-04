import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/useLanguage';
import {
  Map, Signal, Unlock, Activity, Box, Crosshair,
  ArrowLeft, Ruler, BatteryCharging, Radio, ArrowRightLeft, type LucideIcon,
} from 'lucide-react';
import PageHeader from './PageHeader';

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
const FpvRangeCalculator = lazy(() => import('./FpvRangeCalculator'));

// დატვირთვის ინდიკატორი კომპონენტი
const ToolLoader = () => {
  const { t } = useLanguage();
  return (
    <div role="status" className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <div aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      <p className="text-sm text-ink-3">{t('tool_loading')}</p>
    </div>
  );
};

/**
 * One icon treatment for every tool (F1): the per-tool colour fields are gone,
 * and titles are translation keys rather than English literals (F8).
 */
const tools: ReadonlyArray<{ id: string; titleKey: string; descKey: string; icon: LucideIcon }> = [
  { id: 'battery-calc', titleKey: 'tool_title_battery', descKey: 'tool_desc_battery', icon: BatteryCharging },
  { id: 'channel-tuner', titleKey: 'tool_title_channel', descKey: 'tool_desc_channel', icon: Signal },
  { id: 'antenna-tuner', titleKey: 'tool_title_antenna', descKey: 'tool_desc_antenna', icon: Radio },
  { id: 'fresnel', titleKey: 'tool_title_fresnel', descKey: 'tool_desc_fresnel', icon: Ruler },
  { id: 'unlocker', titleKey: 'tool_title_vtx', descKey: 'tool_desc_vtx', icon: Unlock },
  { id: 'harmonics', titleKey: 'tool_title_harmonics', descKey: 'tool_desc_harmonics', icon: Activity },
  { id: 'stl', titleKey: 'tool_title_stl', descKey: 'tool_desc_stl', icon: Box },
  { id: 'zone-check', titleKey: 'tool_title_zone', descKey: 'tool_desc_zone', icon: Map },
  { id: 'converter', titleKey: 'tool_title_rf', descKey: 'tool_desc_rf', icon: ArrowRightLeft },
  { id: 'fpv-range', titleKey: 'tool_title_range', descKey: 'tool_desc_range', icon: Crosshair },
];

const ToolsHub = () => {
  const { t } = useLanguage();
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
    <div className="flex flex-col gap-5">
      {isRoot ? (
        <>
          <PageHeader title={t('route_tools_short')} subtitle={t('tools_subtitle')} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.id}
                className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-[18px] transition-colors duration-150 hover:border-white/[0.14]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-tint text-accent">
                  <tool.icon size={20} aria-hidden="true" />
                </span>
                <h2 className="text-base font-bold text-ink">{t(tool.titleKey)}</h2>
                <p className="text-[13px] leading-normal text-ink-3">{t(tool.descKey)}</p>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          <nav aria-label={t('breadcrumb_label')}>
            <Link
              to="/tools"
              className="-ml-2.5 inline-flex h-9 items-center gap-2 rounded-[10px] px-2.5 text-sm text-ink-3 transition-colors hover:bg-white/5 hover:text-ink"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>{t('route_tools_short')}</span>
              {currentTool && <span aria-hidden="true">/</span>}
              {currentTool && <span className="font-bold text-ink-2">{t(currentTool.titleKey)}</span>}
            </Link>
          </nav>

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
              <Route path="fpv-range" element={<FpvRangeCalculator />} />
            </Routes>
          </Suspense>
        </>
      )}
    </div>
  );
};

export default ToolsHub;