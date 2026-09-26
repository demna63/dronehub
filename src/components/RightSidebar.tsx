import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RightSidebarWeatherCard from './RightSidebarWeatherCard';
import RightSidebarSection from './RightSidebarSection';
import { useLanguage } from '../contexts/useLanguage';
import { useFlightWeather } from '../hooks/useFlightWeather';

const PREFLIGHT_KEYS = [
  'preflight_props',
  'preflight_batteries',
  'preflight_sd',
  'preflight_vtx',
  'preflight_nfz',
] as const;

/**
 * The home feed's right column: flight conditions and the pre-flight list
 * (F9, F10, F11).
 *
 * Removed in the 2026-09 pass: the GPS / Kp card (a hard-coded Kp of 2.3 with
 * no data source behind it), "trending zones" (it printed Lucide icon names as
 * text), the resources links (now in the left sidebar) and the 8px footer.
 */
const RightSidebar: React.FC = () => {
  const { t } = useLanguage();
  const { weather, loading, verdict } = useFlightWeather();
  const [checked, setChecked] = useState<ReadonlySet<number>>(() => new Set());

  const toggle = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <RightSidebarWeatherCard weather={weather} loading={loading} verdict={verdict} />

      <RightSidebarSection
        title={t('preflight_title')}
        meta={t('preflight_counter', { done: checked.size, total: PREFLIGHT_KEYS.length })}
        className="!gap-2"
      >
        <div className="flex flex-col">
          {PREFLIGHT_KEYS.map((key, index) => (
            <label
              key={key}
              htmlFor={`preflight-check-${index}`}
              className="flex min-h-9 cursor-pointer select-none items-center gap-2.5 text-sm text-ink-2"
            >
              <input
                id={`preflight-check-${index}`}
                type="checkbox"
                checked={checked.has(index)}
                onChange={() => toggle(index)}
                className="m-0 h-[18px] w-[18px] cursor-pointer accent-[#0d9488]"
              />
              {t(key)}
            </label>
          ))}
        </div>
        <p className="border-t border-line pt-2 text-[13px] leading-normal text-ink-2">
          {t('preflight_regulations_before')}
          <Link to="/regulations" className="font-bold text-accent hover:underline">
            {t('preflight_regulations_link')}
          </Link>
          {t('preflight_regulations_after')}
        </p>
      </RightSidebarSection>
    </div>
  );
};

export default RightSidebar;
