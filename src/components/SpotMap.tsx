import React, { useCallback, useEffect, useState } from 'react';
import { APIProvider, AdvancedMarker, InfoWindow, Map, type MapMouseEvent } from '@vis.gl/react-google-maps';
import { 
  MapPin, Navigation, AlertTriangle, Info, Image as ImageIcon, 
  Filter, Plus, Wind, Camera, X, Save, MousePointerClick, Loader2
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import type { User } from '../types';

/**
 * Google Maps configuration.
 *
 * The key is a PUBLIC client key by design — it is restricted by HTTP referrer
 * in the Google Cloud console, not by secrecy, exactly like the Firebase web
 * config. `mapId` is required for AdvancedMarker; without one the markers
 * silently never render, which is the kind of blank-screen failure worth
 * failing loudly about instead.
 */
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const MAPS_ID = (import.meta.env.VITE_GOOGLE_MAPS_ID as string | undefined) || 'DEMO_MAP_ID';
const TBILISI = { lat: 41.7151, lng: 44.8271 };

const MARKER_TONE: Record<string, string> = {
  bando: 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.8)]',
  cinematic: 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]',
};
const DEFAULT_TONE = 'bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.8)]';

/** The same glowing dot the Leaflet divIcon drew, as real DOM. */
const SpotPin: React.FC<{ type: string }> = ({ type }) => (
  <span className={`block w-5 h-5 rounded-full border-2 border-slate-950 flex items-center justify-center animate-pulse ${MARKER_TONE[type] || DEFAULT_TONE}`}>
    <span className="block w-1.5 h-1.5 bg-white rounded-full" />
  </span>
);

interface SpotMapProps {
  currentUser?: User | null;
  onLoginClick?: () => void;
}

const SpotMap: React.FC<SpotMapProps> = ({ currentUser = null, onLoginClick }) => {
  const { showToast } = useToast();
  const [spots, setSpots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  /** The spot whose small InfoWindow bubble is open on the map. */
  const [activeInfo, setActiveInfo] = useState<any>(null);
  
  // დამატების სთეითები
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCoords, setNewCoords] = useState<{lat: number, lng: number} | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', type: 'bando', desc: '', warnings: '', author: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSpots = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedSpots = await apiService.getSpots();
      setSpots(fetchedSpots);
    } catch (error) {
      console.error('Error fetching spots:', error);
      showToast('ლოკაციები ვერ ჩაიტვირთა.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void fetchSpots(); }, [fetchSpots]);

  // 2. რუკაზე კლიკის დამუშავება
  const handleMapClick = (event: MapMouseEvent) => {
    if (!isPickingLocation || !event.detail.latLng) return;
    setIsPickingLocation(false);
    setNewCoords({ lat: event.detail.latLng.lat, lng: event.detail.latLng.lng });
    setShowAddModal(true);
  };

  // 3. ფორმის გაგზავნა Firebase-ში
  const handleAddSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoords) return;
    
    setIsSubmitting(true);
    try {
      if (!currentUser) {
        showToast('ლოკაციის დასამატებლად გაიარე ავტორიზაცია.', 'error');
        onLoginClick?.();
        return;
      }
      await apiService.addSpot({
        name: formData.name,
        type: formData.type,
        // Stored as `description` to match the field the rules validate and
        // every reader expects; the form's local key stays `desc`.
        description: formData.desc,
        warnings: formData.warnings,
        author: formData.author,
        lat: newCoords.lat,
        lng: newCoords.lng,
      }, currentUser);
      
      // გავასუფთაოთ ფორმა და გადმოვწეროთ ახალი ბაზა
      setShowAddModal(false);
      setFormData({ name: '', type: 'bando', desc: '', warnings: '', author: '' });
      await fetchSpots();
      
    } catch (error) {
      console.error('Error adding spot:', error);
      showToast('ლოკაცია ვერ დაემატა. სცადე ხელახლა.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSpots = spots.filter(spot => 
    activeFilter === 'all' ? true : spot.type === activeFilter
  );

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-120px)] rounded-3xl overflow-hidden border border-white/10 relative flex">
      
      {/* --- მარცხენა პანელი --- */}
      <div className="w-80 bg-slate-950/90 backdrop-blur-xl border-r border-white/5 flex flex-col z-[400] relative h-full">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-2 mb-2">
            <MapPin className="text-sky-500" size={24} /> FPV SPOTS
          </h1>
          <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Explore & Fly</p>
        </div>

        <div className="p-4 space-y-2 border-b border-white/5">
          <button onClick={() => setActiveFilter('all')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeFilter === 'all' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Filter size={18} /> All Spots
          </button>
          <button onClick={() => setActiveFilter('bando')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeFilter === 'bando' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <AlertTriangle size={18} className={activeFilter === 'bando' ? 'text-white' : 'text-rose-500'} /> Bando / Urban
          </button>
          <button onClick={() => setActiveFilter('cinematic')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeFilter === 'cinematic' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Camera size={18} className={activeFilter === 'cinematic' ? 'text-white' : 'text-emerald-500'} /> Cinematic
          </button>
          <button onClick={() => setActiveFilter('freestyle')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeFilter === 'freestyle' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Wind size={18} className={activeFilter === 'freestyle' ? 'text-white' : 'text-amber-500'} /> Freestyle Park
          </button>
        </div>

        {/* ✅ ADD SPOT BUTTON */}
        <div className="p-4 mt-auto">
          <button 
            onClick={() => {
              setIsPickingLocation(true);
              setSelectedSpot(null);
            }}
            disabled={isPickingLocation}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              isPickingLocation 
                ? 'bg-amber-500 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse'
                : 'bg-white text-slate-950 hover:bg-sky-400 hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
            }`}
          >
            {isPickingLocation ? <MousePointerClick size={18} /> : <Plus size={18} />}
            {isPickingLocation ? 'Pick on Map...' : 'Add Spot'}
          </button>
        </div>
      </div>

      {/* --- რუკა --- */}
      <div className={`flex-1 relative bg-slate-900 ${isPickingLocation ? 'cursor-crosshair' : ''}`}>
        
        {/* Picking Location Banner */}
        {isPickingLocation && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[500] bg-amber-500 text-slate-900 px-6 py-3 rounded-full font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center gap-2 pointer-events-none animate-bounce">
            <MousePointerClick size={18} />
            Click anywhere on the map to place your spot
          </div>
        )}

        {!MAPS_API_KEY ? (
          /* Explicit rather than a blank grey rectangle: a missing key is a
             deployment mistake, and a map that silently renders nothing is the
             hardest kind of failure to diagnose. */
          <div className="w-full h-full flex items-center justify-center p-8">
            <div className="max-w-sm text-center border-2 border-dashed border-white/10 rounded-3xl p-8">
              <MapPin size={40} className="mx-auto text-slate-700 mb-4" aria-hidden="true" />
              <p className="text-sm font-bold text-slate-300 mb-2">რუკა არ არის კონფიგურირებული</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                დააყენე <code className="text-slate-400">VITE_GOOGLE_MAPS_API_KEY</code> და
                {' '}<code className="text-slate-400">VITE_GOOGLE_MAPS_ID</code> გარემოს ცვლადებში.
              </p>
            </div>
          </div>
        ) : (
          <APIProvider apiKey={MAPS_API_KEY}>
            <Map
              mapId={MAPS_ID}
              defaultCenter={TBILISI}
              defaultZoom={11}
              // Dark without a custom cloud style; the map ID only has to exist.
              colorScheme="DARK"
              gestureHandling="greedy"
              disableDefaultUI
              zoomControl
              onClick={handleMapClick}
              className="w-full h-full"
            >
              {!isLoading && filteredSpots.map((spot: any) => (
                <AdvancedMarker
                  key={spot.id}
                  position={{ lat: Number(spot.lat), lng: Number(spot.lng) }}
                  title={spot.name}
                  onClick={() => setActiveInfo(spot)}
                >
                  <SpotPin type={spot.type} />
                </AdvancedMarker>
              ))}

              {activeInfo && (
                <InfoWindow
                  position={{ lat: Number(activeInfo.lat), lng: Number(activeInfo.lng) }}
                  onCloseClick={() => setActiveInfo(null)}
                >
                  <div className="p-1">
                    <h3 className="font-black text-slate-900 text-sm mb-1">{activeInfo.name}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-2">{activeInfo.type}</p>
                    <button
                      type="button"
                      onClick={() => { setSelectedSpot(activeInfo); setActiveInfo(null); }}
                      className="text-[10px] text-sky-600 font-bold uppercase hover:underline"
                    >
                      დეტალები &rarr;
                    </button>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        )}

        {/* --- Spot Details Modal --- */}
        {selectedSpot && !isPickingLocation && (
          <div className="absolute top-6 right-6 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[400] overflow-hidden animate-in slide-in-from-right-4">
            <div className="h-32 bg-slate-800 relative flex items-center justify-center border-b border-white/5">
              <ImageIcon size={32} className="text-slate-600" />
              <button onClick={() => setSelectedSpot(null)} className="absolute top-2 right-2 w-8 h-8 bg-slate-950/50 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm">×</button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-950/80 rounded-md text-[10px] font-bold text-white uppercase backdrop-blur-sm">{selectedSpot.type}</div>
            </div>
            <div className="p-5">
              <h2 className="text-lg font-black text-white mb-3 leading-tight">{selectedSpot.name}</h2>
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1 mb-1"><Info size={12}/> Description</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{selectedSpot.description || selectedSpot.desc}</p>
                </div>
                {selectedSpot.warnings && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    <h4 className="text-[10px] text-amber-500 font-bold uppercase flex items-center gap-1 mb-1"><AlertTriangle size={12}/> Warnings</h4>
                    <p className="text-xs text-amber-400/80 leading-relaxed">{selectedSpot.warnings}</p>
                  </div>
                )}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Pilot: <strong className="text-sky-400">{selectedSpot.author}</strong></span>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.lat},${selectedSpot.lng}`} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-sky-500 hover:text-white text-slate-400 rounded-lg transition-colors">
                    <Navigation size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ADD NEW SPOT MODAL (Form) --- */}
        {showAddModal && newCoords && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                <h2 className="text-xl font-black text-white flex items-center gap-2"><MapPin className="text-sky-500"/> Add New Spot</h2>
                <button onClick={() => setShowAddModal(false)} aria-label="დახურვა" className="text-slate-400 hover:text-white"><X size={20}/></button>
              </div>
              
              <form onSubmit={handleAddSpot} className="p-6 space-y-4">
                <div>
                  <label htmlFor="spot-name" className="block text-xs font-bold text-slate-500 uppercase mb-1">Spot Name</label>
                  <input id="spot-name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none" placeholder="e.g. Abandoned Factory" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="spot-type" className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                    <select id="spot-type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none appearance-none">
                      <option value="bando">Bando / Urban</option>
                      <option value="cinematic">Cinematic</option>
                      <option value="freestyle">Freestyle</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="spot-author" className="block text-xs font-bold text-slate-500 uppercase mb-1">Pilot Name</label>
                    <input id="spot-author" required value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none" placeholder="Your FPV handle" />
                  </div>
                </div>

                <div>
                  <label htmlFor="spot-desc" className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                  <textarea id="spot-desc" required value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none min-h-[80px]" placeholder="What makes this spot good?" />
                </div>

                <div>
                  <label htmlFor="spot-warnings" className="block text-xs font-bold text-amber-500 uppercase mb-1">Warnings (Optional)</label>
                  <textarea id="spot-warnings" value={formData.warnings} onChange={e => setFormData({...formData, warnings: e.target.value})} className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-100 focus:border-amber-500 focus:outline-none min-h-[60px]" placeholder="Security, dogs, people..." />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all mt-4">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSubmitting ? 'Saving...' : 'Save Spot'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SpotMap;