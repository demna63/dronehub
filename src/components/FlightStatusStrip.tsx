import React from 'react';
import { useLanguage } from '../contexts/useLanguage';
import { useFlightWeather, VERDICT_STYLE } from '../hooks/useFlightWeather';

/**
 * Flight status for screens without the right sidebar (F16).
 *
 * Shares one forecast request with the sidebar card via useFlightWeather, so
 * rendering both (one hidden by CSS) costs nothing extra.
 */
const FlightStatusStrip: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useLanguage();
  const { weather, loading, verdict } = useFlightWeather();
  const style = VERDICT_STYLE[verdict];
  const value = (n: number | undefined) => (!loading && n !== undefined ? String(n) : '--');

  return (
    <div
      role="status"
      className={`flex items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[13px] text-ink-2 ${className}`}
    >
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-extrabold ${style.className}`}>{style.code}</span>
      <span className="sr-only">{t(style.labelKey)}</span>
      <span className="min-w-0 truncate">
        {t('flight_strip_summary', { city: t('city_tbilisi'), temp: value(weather?.temp), wind: value(weather?.wind) })}
      </span>
    </div>
  );
};

export default FlightStatusStrip;
