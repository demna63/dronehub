import React from 'react';
import type { FlightWeather } from '../types';
import { useLanguage } from '../contexts/useLanguage';
import { VERDICT_STYLE, type FlightVerdict } from '../hooks/useFlightWeather';
import RightSidebarSection from './RightSidebarSection';

interface RightSidebarWeatherCardProps {
  /** Null while loading, and also when the forecast could not be fetched. */
  weather: FlightWeather | null;
  loading: boolean;
  verdict: FlightVerdict;
}

interface ReadingProps {
  label: string;
  value: string;
  unit?: string;
}

const Reading: React.FC<ReadingProps> = ({ label, value, unit }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-ink-3">{label}</span>
    <span className="text-xl font-extrabold text-ink">
      {value}
      {unit && <span className="ml-1 text-xs font-medium text-ink-3">{unit}</span>}
    </span>
  </div>
);

/**
 * Flight conditions (F10, F12).
 *
 * The status box only changes colour when the verdict changes; there is no
 * looping animation. `weather` is null both while loading and after a failed
 * fetch and the two render identically: a stale or invented number here is a
 * flight decision made on data that was never measured.
 */
const RightSidebarWeatherCard: React.FC<RightSidebarWeatherCardProps> = ({ weather, loading, verdict }) => {
  const { t } = useLanguage();
  const style = VERDICT_STYLE[verdict];
  const reading = (value: number | undefined): string =>
    !loading && value !== undefined ? String(value) : '--';

  return (
    <RightSidebarSection title={t('flight_conditions_title')} meta={t('city_tbilisi')}>
      <div role="status" className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 ${style.className}`}>
        <span className="text-[13px] font-extrabold">{style.code}</span>
        <span className="text-[13px]">{t(style.labelKey)}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Reading label={t('weather_temperature')} value={`${reading(weather?.temp)}°`} />
        <Reading label={t('weather_precipitation')} value={`${reading(weather?.rain)}%`} />
        <Reading label={t('weather_wind')} value={reading(weather?.wind)} unit={t('unit_kmh')} />
        <Reading label={t('weather_gusts')} value={reading(weather?.gusts)} unit={t('unit_kmh')} />
      </div>

      <div className="flex justify-between border-t border-line pt-3 text-[13px] text-ink-2">
        <span>{weather?.isNight ? t('weather_sunrise') : t('weather_sunset')}</span>
        <span className="font-bold text-ink tabular-nums">{!loading && weather ? weather.sunTime : '--:--'}</span>
      </div>
    </RightSidebarSection>
  );
};

export default RightSidebarWeatherCard;
