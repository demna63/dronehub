import { useEffect, useState } from 'react';
import type { FlightWeather } from '../types';

/** The shape of the Open-Meteo fields this module requests. */
interface OpenMeteoForecast {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    wind_direction_10m: number;
    precipitation_probability: number | null;
  };
  daily: {
    sunrise: string[];
    sunset: string[];
  };
}

/** Tbilisi. The feed's shared request stays on this point. */
const TBILISI_LAT = 41.7151;
const TBILISI_LNG = 44.8271;

/**
 * Open-Meteo current conditions for any point.
 * `timezone=auto` makes sunrise and sunset local to that point.
 */
export const flightForecastUrl = (lat: number, lng: number): string =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation_probability&daily=sunrise,sunset&timezone=auto&wind_speed_unit=kmh`;

const FORECAST_URL = flightForecastUrl(TBILISI_LAT, TBILISI_LNG);

export type FlightVerdict = 'FLY' | 'CAUTION' | 'NO_FLY' | 'UNKNOWN';

/**
 * Go / no-go from the current reading.
 *
 * `null` weather is UNKNOWN, never FLY: an outage must not read as a green
 * light. Thresholds are unchanged from the original sidebar.
 */
export const flightVerdict = (weather: FlightWeather | null): FlightVerdict => {
  if (!weather) return 'UNKNOWN';
  if (weather.wind > 35 || weather.gusts > 45 || weather.rain > 40) return 'NO_FLY';
  if (weather.wind > 20 || weather.rain > 15) return 'CAUTION';
  return 'FLY';
};

/** Display tokens per verdict: status colours only (F1), code and label keys. */
export const VERDICT_STYLE: Record<FlightVerdict, { code: string; labelKey: string; className: string }> = {
  FLY: { code: '✓ FLY', labelKey: 'flight_status_fly', className: 'bg-ok text-[#022c22]' },
  CAUTION: { code: '! CAUTION', labelKey: 'flight_status_caution', className: 'bg-warn text-[#451a03]' },
  NO_FLY: { code: '✕ NO FLY', labelKey: 'flight_status_no_fly', className: 'bg-bad text-white' },
  UNKNOWN: { code: '—', labelKey: 'flight_status_unknown', className: 'bg-surface-2 text-ink-2' },
};

const parseForecast = (data: OpenMeteoForecast): FlightWeather => {
  const now = new Date();
  const sunsetTime = new Date(data.daily.sunset[0]);
  const isNight = now > sunsetTime;
  return {
    temp: Math.round(data.current.temperature_2m),
    wind: Math.round(data.current.wind_speed_10m),
    gusts: Math.round(data.current.wind_gusts_10m),
    direction: data.current.wind_direction_10m,
    rain: data.current.precipitation_probability || 0,
    // After sunset the relevant time is tomorrow's sunrise.
    sunTime: isNight
      ? (data.daily.sunrise[1] ?? data.daily.sunrise[0]).split('T')[1]
      : data.daily.sunset[0].split('T')[1],
    isNight,
  };
};

/**
 * One request per page load, shared by every consumer.
 *
 * The desktop sidebar and the mobile status strip both read this; both are
 * mounted at once (one is merely hidden by CSS), and a per-hook fetch would
 * double the request.
 */
let shared: Promise<FlightWeather | null> | null = null;

const loadWeather = (): Promise<FlightWeather | null> => {
  if (!shared) {
    shared = fetch(FORECAST_URL)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Open-Meteo responded ${response.status}`);
        return parseForecast((await response.json()) as OpenMeteoForecast);
      })
      .catch((error: unknown) => {
        // Deliberately null rather than plausible-looking numbers: a fallback
        // of calm weather evaluates to FLY and tells pilots conditions are
        // safe when nothing has been measured. Cleared so a later mount retries.
        console.error('Weather fetch failed:', error);
        shared = null;
        return null;
      });
  }
  return shared;
};

export interface FlightWeatherState {
  /** Null while loading and after a failed fetch — the two look the same. */
  weather: FlightWeather | null;
  loading: boolean;
  verdict: FlightVerdict;
}

export const useFlightWeather = (): FlightWeatherState => {
  const [weather, setWeather] = useState<FlightWeather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadWeather().then((result) => {
      if (cancelled) return;
      setWeather(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { weather, loading, verdict: flightVerdict(weather) };
};

/**
 * Conditions at a pin or at the pilot.
 *
 * Successes are remembered for the page session, rounded to two decimals
 * (about a kilometre), so flipping between nearby spots does not refetch.
 * A failure is not remembered: the next open tries again. `null` is never
 * turned into a flyable reading.
 */
const pointCache = new Map<string, FlightWeather>();

export const fetchFlightWeather = async (lat: number, lng: number): Promise<FlightWeather | null> => {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = pointCache.get(key);
  if (cached) return cached;
  try {
    const [latKey, lngKey] = key.split(',');
    const response = await fetch(flightForecastUrl(Number(latKey), Number(lngKey)));
    if (!response.ok) throw new Error(`Open-Meteo responded ${response.status}`);
    const weather = parseForecast((await response.json()) as OpenMeteoForecast);
    pointCache.set(key, weather);
    return weather;
  } catch (error: unknown) {
    console.error('Weather fetch failed:', error);
    return null;
  }
};

const pointIsSet = (lat: number | null, lng: number | null): boolean =>
  lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);

/** Weather for one point. Passing null clears the previous reading. */
export const usePointWeather = (lat: number | null, lng: number | null): FlightWeatherState => {
  const [weather, setWeather] = useState<FlightWeather | null>(null);
  const [loading, setLoading] = useState(() => pointIsSet(lat, lng));

  useEffect(() => {
    if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) {
      setWeather(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setWeather(null);
    setLoading(true);
    void fetchFlightWeather(lat, lng).then((result) => {
      if (cancelled) return;
      setWeather(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return { weather, loading, verdict: flightVerdict(weather) };
};
