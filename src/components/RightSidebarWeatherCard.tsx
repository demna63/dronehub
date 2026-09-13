import React from 'react';
import { Wind, MapPin, Thermometer, Droplets, Compass, Sunrise, Sunset } from 'lucide-react';
import type { FlightWeather } from '../types';

interface RightSidebarWeatherCardProps {
  /** Null while loading, and also when the forecast could not be fetched. */
  weather: FlightWeather | null;
  loading: boolean;
  status: { status: string; color: string; text: string };
}

const RightSidebarWeatherCard: React.FC<RightSidebarWeatherCardProps> = ({ weather, loading, status }) => {
  /**
   * `weather` is null both while loading and after a failed fetch, and the two
   * must look the same: a stale or invented number here is a flight decision
   * made on data that was never measured.
   */
  const reading = (value: number | undefined, placeholder = '--'): string =>
    !loading && value !== undefined ? String(value) : placeholder;
  const rain = weather?.rain ?? 0;

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 relative overflow-hidden shadow-xl">
      <div className={`absolute top-0 right-0 w-32 h-32 ${status.color} opacity-10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2`}></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
          <MapPin size={10} className="text-rose-500" /> თბილისი
        </div>
        <div className={`text-[10px] font-black px-2.5 py-1 rounded-md shadow-lg ${status.color} ${status.text} animate-pulse`}>
          {status.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 relative z-10 mb-2">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex items-center justify-between group">
          <Thermometer size={14} className="text-orange-400 group-hover:scale-110 transition-transform" />
          <span className="text-lg font-black text-white">{reading(weather?.temp)}°</span>
        </div>
        <div className={`bg-slate-950/60 p-3 rounded-xl border border-white/5 flex items-center justify-between ${rain > 20 ? 'border-sky-500/50' : ''}`}>
          <Droplets size={14} className="text-sky-400" />
          <span className={`text-lg font-black ${rain > 20 ? 'text-sky-400 font-bold' : 'text-white'}`}>
            {reading(weather?.rain)}%
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-3 rounded-xl border border-orange-500/10 relative z-10 mb-2 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-2">
          {weather?.isNight ? <Sunrise size={16} className="text-amber-400" /> : <Sunset size={16} className="text-orange-500" />}
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
            {weather?.isNight ? 'მზის ამოსვლა' : 'მზის ჩასვლა'}
          </span>
        </div>
        <span className="text-sm font-black text-orange-400 font-mono">
          {!loading && weather ? weather.sunTime : '--:--'}
        </span>
      </div>

      <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
            <Wind size={12} /> ქარი
          </div>
          <div className="flex items-center gap-1">
            <Compass size={12} className="text-emerald-400 transition-transform duration-1000" style={{ transform: `rotate(${weather?.direction || 0}deg)` }} />
            <span className="text-[9px] text-slate-400 font-mono">{reading(weather?.direction)}°</span>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-black text-white leading-none">{reading(weather?.wind)}</span>
          <span className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-tighter">კმ/ს</span>
          <div className="ml-auto text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 uppercase">
            ბრიგვა: {reading(weather?.gusts)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebarWeatherCard;
