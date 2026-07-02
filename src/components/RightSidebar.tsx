import React, { useState, useEffect } from 'react';
import { User, Category } from '../types';
import { Satellite, Activity, CheckCircle2, ExternalLink, AlertTriangle } from 'lucide-react';
import RightSidebarWeatherCard from './RightSidebarWeatherCard';
import RightSidebarSection from './RightSidebarSection';

interface RightSidebarProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  trendingCommunities: Category[];
  onCommunityClick: (id: string) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ 
  currentUser, 
  onOpenAuth, 
  trendingCommunities, 
  onCommunityClick 
}) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=41.7151&longitude=44.8271&current=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation_probability&daily=sunrise,sunset&timezone=auto&wind_speed_unit=kmh'
        );
        const data = await response.json();
        
        const now = new Date();
        const sunsetTime = new Date(data.daily.sunset[0]);
        const isNight = now > sunsetTime;

        setWeather({
          temp: Math.round(data.current.temperature_2m),
          wind: Math.round(data.current.wind_speed_10m),
          gusts: Math.round(data.current.wind_gusts_10m),
          direction: data.current.wind_direction_10m,
          rain: data.current.precipitation_probability || 0,
          sunTime: isNight 
            ? data.daily.sunrise[1].split('T')[1] // ხვალინდელი ამოსვლა
            : data.daily.sunset[0].split('T')[1], // დღევანდელი ჩასვლა
          isNight
        });
      } catch (error) {
        setWeather({ temp: 20, wind: 5, gusts: 8, direction: 0, rain: 0, sunTime: '20:00', isNight: false });
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const getFlightStatus = () => {
    if (!weather) return { status: '...', color: 'bg-slate-500', text: 'text-slate-200' };
    if (weather.wind > 35 || weather.gusts > 45 || weather.rain > 40) 
      return { status: 'NO FLY', color: 'bg-rose-500', text: 'text-rose-100' };
    if (weather.wind > 20 || weather.rain > 15) 
      return { status: 'CAUTION', color: 'bg-amber-500', text: 'text-amber-950' };
    return { status: 'FLY', color: 'bg-emerald-500', text: 'text-emerald-950' };
  };

  const status = getFlightStatus();

  return (
    <div className="flex flex-col gap-4">
      
      <RightSidebarWeatherCard weather={weather} loading={loading} status={status} />

      <RightSidebarSection title="GPS სიგნალის სტატუსი" icon={<Satellite size={12} className="text-sky-500" />}>
        <div className="flex items-center justify-between p-3 bg-slate-950 border border-white/5 rounded-xl group hover:border-sky-500/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Activity size={18} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kp-Index: 2.3</div>
              <div className="text-sm font-black text-white">სტაბილური</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Safe to fly</div>
          </div>
        </div>
        <p className="text-[9px] text-slate-500 mt-2 px-1 leading-relaxed">
          დაბალი Kp-ინდექსი ნიშნავს ძლიერ და სტაბილურ GPS კავშირს. (1-4 უსაფრთხოა, 5+ საშიშია)
        </p>
      </RightSidebarSection>

      <RightSidebarSection title="ფრენის წინ" icon={<CheckCircle2 size={12} className="text-emerald-500" />}>
        <div className="space-y-1.5 text-xs text-slate-300">
          {[
            'პროპელერები დამაგრებულია?',
            'ბატარეები 100%-ზეა?',
            'SD ბარათი ჩადებულია?',
            'Vtx ანტენა შეერთებულია?',
            'No-Fly Zone შემოწმებულია?'
          ].map((item, i) => (
            <label key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
              <input type="checkbox" className="accent-emerald-500 w-4 h-4 rounded border-white/10 bg-slate-950 cursor-pointer" />
              <span className="group-hover:text-white transition-colors select-none">{item}</span>
            </label>
          ))}
        </div>
      </RightSidebarSection>

      <RightSidebarSection title="ტრენდული ზონები" icon={<Activity size={12} className="text-violet-400" />}>
        <div className="space-y-2">
          {trendingCommunities.map((community) => (
            <button
              key={community.id}
              type="button"
              onClick={() => onCommunityClick(community.id)}
              className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-white/5 border border-white/5 rounded-xl transition-colors group text-left"
            >
              <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                {community.icon} {community.name}
              </span>
            </button>
          ))}
        </div>
      </RightSidebarSection>

      <RightSidebarSection title="რესურსები" icon={<ExternalLink size={12} className="text-indigo-400" />}>
        <div className="space-y-2">
          <a href="/map" className="flex items-center justify-between p-2.5 bg-slate-950 hover:bg-white/5 border border-white/5 rounded-xl transition-colors group">
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">ლოკაციები & რუკა</span>
            <ExternalLink size={12} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </a>
          <a href="/regulations" className="flex items-center justify-between p-2.5 bg-slate-950 hover:bg-white/5 border border-white/5 rounded-xl transition-colors group">
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">საქ. რეგულაციები</span>
            <ExternalLink size={12} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </a>
          <div className="flex items-start gap-2 p-3 mt-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <AlertTriangle size={14} className="text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-rose-300/80 leading-relaxed font-bold uppercase tracking-widest">
              ყოველთვის შეამოწმეთ გარემო აფრენამდე!
            </p>
          </div>
        </div>
      </RightSidebarSection>

      {/* Footer info */}
      <div className="text-center opacity-40 hover:opacity-100 transition-opacity px-4 pb-4">
        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-loose">
          DroneHub GE &bull; 2026 <br/>
          Safe Skies &bull; Happy Flying
        </p>
      </div>
    </div>
  );
};

export default RightSidebar;