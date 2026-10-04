import { describe, expect, it } from 'vitest';
import type { FlightWeather } from '../types';
import { flightForecastUrl, flightVerdict } from './useFlightWeather';

const reading = (patch: Partial<FlightWeather>): FlightWeather => ({
  temp: 20,
  wind: 10,
  gusts: 12,
  direction: 0,
  rain: 0,
  sunTime: '18:00:00',
  isNight: false,
  ...patch,
});

describe('flightForecastUrl', () => {
  it('keeps the feed on the Tbilisi request it already used', () => {
    expect(flightForecastUrl(41.7151, 44.8271)).toBe(
      'https://api.open-meteo.com/v1/forecast?latitude=41.7151&longitude=44.8271&current=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation_probability&daily=sunrise,sunset&timezone=auto&wind_speed_unit=kmh',
    );
  });

  it('asks Open-Meteo for the point the pilot picked', () => {
    expect(flightForecastUrl(42.26, 42.7)).toContain('latitude=42.26');
    expect(flightForecastUrl(42.26, 42.7)).toContain('longitude=42.7');
  });
});

describe('flightVerdict', () => {
  it('stays unknown without a reading and uses the feed thresholds', () => {
    expect(flightVerdict(null)).toBe('UNKNOWN');
    expect(flightVerdict(reading({ wind: 10, gusts: 12, rain: 0 }))).toBe('FLY');
    expect(flightVerdict(reading({ wind: 21 }))).toBe('CAUTION');
    expect(flightVerdict(reading({ rain: 16 }))).toBe('CAUTION');
    expect(flightVerdict(reading({ wind: 36 }))).toBe('NO_FLY');
    expect(flightVerdict(reading({ gusts: 46 }))).toBe('NO_FLY');
    expect(flightVerdict(reading({ rain: 41 }))).toBe('NO_FLY');
  });
});
