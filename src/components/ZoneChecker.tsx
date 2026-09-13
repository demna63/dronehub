import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { MapPin, Navigation, AlertTriangle, CheckCircle, Ban, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const ZoneChecker = () => {
  const { showToast } = useToast();
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('ბრაუზერი ლოკაციას არ უჭერს მხარს.', 'error');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toString());
        setLng(pos.coords.longitude.toString());
        setLoading(false);
      },
      (geoError) => {
        console.error('Geolocation failed:', geoError);
        showToast('ვერ მოხერხდა ლოკაციის გაგება.', 'error');
        setLoading(false);
      }
    );
  };

  const handleCheck = async () => {
    if (!lat || !lng) return;
    setLoading(true);
    try {
      const data = await geminiService.checkZoneWithAI(parseFloat(lat), parseFloat(lng));
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-2">
          <MapPin size={24} />
        </div>
        <h2 className="text-2xl font-black text-white uppercase italic">ZONE <span className="text-indigo-500">CHECKER</span></h2>
        <p className="text-slate-400 text-sm">შეამოწმე უსაფრთხოა თუ არა ფრენა AI-ს დახმარებით</p>
        <p className="text-[11px] text-amber-300/80 max-w-md mx-auto">
          ეს ინსტრუმენტი მხოლოდ საინფორმაციოა და არ ცვლის ოფიციალურ ავიაციის წესებს ან NOTAM-ებს.
        </p>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
        <button 
          onClick={handleCurrentLocation}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Navigation size={18} />}
          ჩემი ლოკაციის გამოყენება
        </button>

        <div className="flex items-center gap-4">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-[10px] text-slate-400 uppercase">ან კოორდინატებით</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input type="number" placeholder="Latitude" value={lat} onChange={e => setLat(e.target.value)} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none text-center font-mono" />
          <input type="number" placeholder="Longitude" value={lng} onChange={e => setLng(e.target.value)} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none text-center font-mono" />
        </div>

        <button 
          onClick={handleCheck}
          disabled={!lat || !lng || loading}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'მოწმდება...' : 'შემოწმება'}
        </button>
      </div>

      {result && (
        <div className={`p-6 rounded-2xl border flex items-start gap-4 animate-in slide-in-from-bottom-2 ${
          result.status === 'RESTRICTED' ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' :
          result.status === 'CAUTION' ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' :
          'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className={`p-3 rounded-xl shrink-0 ${
             result.status === 'RESTRICTED' ? 'bg-rose-500/20' :
             result.status === 'CAUTION' ? 'bg-amber-500/20' :
             'bg-emerald-500/20'
          }`}>
            {result.status === 'RESTRICTED' ? <Ban size={24} /> :
             result.status === 'CAUTION' ? <AlertTriangle size={24} /> :
             <CheckCircle size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">{result.status}</h3>
            <p className="text-sm opacity-60">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneChecker;