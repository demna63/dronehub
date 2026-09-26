import React, { useCallback, useEffect, useState } from 'react';
import { APIProvider, AdvancedMarker, Map, type MapMouseEvent } from '@vis.gl/react-google-maps';
import { Plus, X } from 'lucide-react';
import Modal from './Modal';
import PageHeader from './PageHeader';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/useToast';
import type { Spot, User } from '../types';
import { useLanguage } from '../contexts/useLanguage';

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

/**
 * Spot types. Colours are data colours for the pins and filter dots only;
 * everything else on the page uses the one accent (F1).
 */
const SPOT_TYPES = [
  { id: 'bando', labelKey: 'spot_type_bando', shortKey: 'spot_type_bando_short', color: '#fb7185' },
  { id: 'cinematic', labelKey: 'spot_type_cinematic', shortKey: 'spot_type_cinematic_short', color: '#34d399' },
  { id: 'freestyle', labelKey: 'spot_type_freestyle', shortKey: 'spot_type_freestyle_short', color: '#fbbf24' },
] as const;

const ACCENT = '#2dd4bf';
const typeOf = (id: string) => SPOT_TYPES.find((type) => type.id === id);

/**
 * A static pin (F12): a 16px dot with a ground-coloured ring, no pulse or
 * glow. The selected spot is larger and in the accent.
 */
const SpotPin: React.FC<{ type: string; selected: boolean }> = ({ type, selected }) => (
  <span
    className={`block rounded-full border-bg ${selected ? 'h-[22px] w-[22px] border-[3px]' : 'h-4 w-4 border-2'}`}
    style={{
      backgroundColor: selected ? ACCENT : (typeOf(type)?.color ?? ACCENT),
      boxShadow: selected ? `0 0 0 2px ${ACCENT}` : undefined,
    }}
  />
);

interface SpotMapProps {
  currentUser?: User | null;
  onLoginClick?: () => void;
}

const SpotMap: React.FC<SpotMapProps> = ({ currentUser = null, onLoginClick }) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  /** Mobile bottom sheet: collapsed shows name + actions, expanded the rest. */
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

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
      showToast(t('spots_load_failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

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
        showToast(t('spot_add_needs_auth'), 'error');
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
      showToast(t('spot_add_failed'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSpots = spots.filter(spot =>
    activeFilter === 'all' ? true : spot.type === activeFilter
  );
  const countOf = (typeId: string) => spots.filter((spot) => spot.type === typeId).length;

  const startAddSpot = () => {
    if (!currentUser) {
      showToast(t('spot_add_needs_auth'), 'error');
      onLoginClick?.();
      return;
    }
    setSelectedSpot(null);
    setIsPickingLocation(true);
  };

  const selectSpot = (spot: Spot) => {
    setSelectedSpot(spot);
    setIsSheetExpanded(false);
  };

  const routeUrl = (spot: Spot) =>
    `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;

  const INPUT = 'w-full rounded-[10px] border border-white/10 bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-accent/50 focus:outline-none';
  const LABEL = 'mb-1 block text-xs font-bold text-ink-3';
  const PRIMARY = 'flex items-center justify-center gap-2 rounded-[10px] bg-accent-fill text-sm font-bold text-white transition-colors duration-150 hover:bg-accent-fill-hover active:bg-accent-fill-active disabled:opacity-60';
  const SECONDARY = 'flex items-center justify-center rounded-[10px] border border-white/[0.12] text-sm font-bold text-ink transition-colors duration-150 hover:bg-white/5';

  const selectedType = selectedSpot ? typeOf(selectedSpot.type) : undefined;
  const selectedDescription = selectedSpot ? (selectedSpot.description || selectedSpot.desc) : undefined;

  const warningBox = selectedSpot?.warnings && (
    <div className="rounded-[10px] border border-warn/25 bg-warn/10 px-3 py-2.5 text-[13px] leading-normal text-[#fcd34d]">
      <strong>{t('spot_warning_label')}</strong> {selectedSpot.warnings}
    </div>
  );

  return (
    <div className="relative -mx-4 -mb-4 -mt-6 flex h-[calc(100dvh-4rem)] overflow-hidden md:m-0 md:h-full md:rounded-2xl md:border md:border-line">

      {/* --- Desktop panel (F17) --- */}
      <div className="hidden w-[280px] shrink-0 flex-col gap-4 border-r border-line bg-surface p-5 md:flex">
        <PageHeader title={t('spots_title')} subtitle={t('spots_subtitle')} size="panel" />

        <div role="group" aria-label={t('spots_filter_label')} className="flex flex-col gap-1 text-sm">
          <button
            type="button"
            aria-pressed={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors duration-150 ${activeFilter === 'all' ? 'bg-accent-tint font-bold text-accent' : 'text-ink-2 hover:bg-white/5'}`}
          >
            {t('spots_all')}
            <span className={`ml-auto text-xs ${activeFilter === 'all' ? '' : 'text-ink-3'}`}>{spots.length}</span>
          </button>
          {SPOT_TYPES.map((type) => {
            const isActive = activeFilter === type.id;
            return (
              <button
                key={type.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveFilter(type.id)}
                className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors duration-150 ${isActive ? 'bg-accent-tint font-bold text-accent' : 'text-ink-2 hover:bg-white/5'}`}
              >
                <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: type.color }} />
                {t(type.labelKey)}
                <span className={`ml-auto text-xs ${isActive ? '' : 'text-ink-3'}`}>{countOf(type.id)}</span>
              </button>
            );
          })}
        </div>

        <button type="button" onClick={startAddSpot} disabled={isPickingLocation} className={`${PRIMARY} mt-auto h-11`}>
          <Plus size={16} aria-hidden="true" /> {t('spot_add')}
        </button>
      </div>

      {/* --- Map --- */}
      <div className={`relative flex-1 bg-[#0b1324] ${isPickingLocation ? 'cursor-crosshair' : ''}`}>

        {/* Mobile top bar: title, add, filter chips. */}
        <div className="absolute inset-x-0 top-0 z-[400] flex flex-col gap-2.5 bg-bg/[0.92] px-4 py-3.5 md:hidden">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-extrabold text-ink">{t('spots_title')}</h1>
            <button
              type="button"
              aria-label={t('spot_add')}
              onClick={startAddSpot}
              disabled={isPickingLocation}
              className={`${PRIMARY} h-11 w-11`}
            >
              <Plus size={20} aria-hidden="true" />
            </button>
          </div>
          <div role="group" aria-label={t('spots_filter_label')} className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 text-[13px]">
            <button
              type="button"
              aria-pressed={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
              className={`h-9 shrink-0 rounded-[10px] px-3 ${activeFilter === 'all' ? 'bg-accent-tint font-bold text-accent' : 'border border-white/10 text-ink-2'}`}
            >
              {t('filter_all')}
            </button>
            {SPOT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                aria-pressed={activeFilter === type.id}
                onClick={() => setActiveFilter(type.id)}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3 ${activeFilter === type.id ? 'bg-accent-tint font-bold text-accent' : 'border border-white/10 text-ink-2'}`}
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: type.color }} />
                {t(type.shortKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Pick-on-map banner: static, no bounce (F12). */}
        {isPickingLocation && (
          <div className="absolute left-1/2 top-[136px] z-[500] flex -translate-x-1/2 items-center gap-2 rounded-[10px] bg-warn px-4 py-2.5 text-[13px] font-bold text-[#451a03] shadow-lg md:top-5">
            {t('spot_pick_hint')}
            <button
              type="button"
              aria-label={t('action_cancel')}
              onClick={() => setIsPickingLocation(false)}
              className="-mr-1.5 flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/10"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {!MAPS_API_KEY ? (
          /* Explicit rather than a blank rectangle: a missing key is a
             deployment mistake, and a silent blank map is hard to diagnose. */
          <div className="flex h-full w-full items-center justify-center p-8">
            <div className="max-w-sm rounded-2xl border border-line bg-surface p-8 text-center">
              <p className="mb-2 text-sm font-bold text-ink-2">{t('map_not_configured')}</p>
              <p className="text-[13px] leading-relaxed text-ink-3">
                {t('map_set_env_vars')}
                {' '}<code className="text-ink-2">VITE_GOOGLE_MAPS_API_KEY</code>
                {', '}<code className="text-ink-2">VITE_GOOGLE_MAPS_ID</code>
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
              className="h-full w-full"
            >
              {!isLoading && filteredSpots.map((spot) => (
                <AdvancedMarker
                  key={spot.id}
                  position={{ lat: Number(spot.lat), lng: Number(spot.lng) }}
                  title={spot.name}
                  onClick={() => selectSpot(spot)}
                  zIndex={selectedSpot?.id === spot.id ? 10 : undefined}
                >
                  <SpotPin type={spot.type} selected={selectedSpot?.id === spot.id} />
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
        )}

        {/* --- Desktop detail card --- */}
        {selectedSpot && !isPickingLocation && (
          <section
            aria-label={selectedSpot.name}
            className="absolute right-5 top-5 z-[400] hidden w-[300px] overflow-hidden rounded-2xl border border-white/[0.08] bg-surface md:block"
          >
            <div className="relative h-[120px] bg-surface-2">
              <button
                type="button"
                aria-label={t('action_close')}
                onClick={() => setSelectedSpot(null)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-bg/70 text-ink-2 transition-colors hover:text-ink"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-col gap-2.5 p-4">
              <span className="text-xs font-bold" style={{ color: selectedType?.color ?? ACCENT }}>
                {selectedType ? t(selectedType.labelKey) : selectedSpot.type}
              </span>
              <h2 className="text-[17px] font-extrabold text-ink">{selectedSpot.name}</h2>
              {selectedDescription && <p className="text-sm leading-normal text-ink-2">{selectedDescription}</p>}
              {warningBox}
              <div className="flex items-center justify-between pt-1.5 text-[13px] text-ink-3">
                <span>{t('spot_pilot_label')} <strong className="text-[#e2e8f0]">{selectedSpot.author}</strong></span>
                <a href={routeUrl(selectedSpot)} target="_blank" rel="noopener noreferrer" className={`${SECONDARY} h-9 px-3`}>
                  {t('spot_route')}
                </a>
              </div>
            </div>
          </section>
        )}

        {/* --- Mobile bottom sheet (F17) --- */}
        {selectedSpot && !isPickingLocation && (
          <section
            aria-label={selectedSpot.name}
            className="absolute inset-x-0 bottom-0 z-[400] flex flex-col gap-2 rounded-t-2xl border-t border-white/[0.08] bg-surface px-[18px] pb-[22px] pt-2.5 md:hidden"
          >
            <button
              type="button"
              aria-label={t('action_close')}
              onClick={() => setSelectedSpot(null)}
              className="flex h-6 items-center justify-center self-center"
            >
              <span aria-hidden="true" className="h-1 w-10 rounded-full bg-[#334155]" />
            </button>
            <span className="text-xs font-bold" style={{ color: selectedType?.color ?? ACCENT }}>
              {selectedType ? t(selectedType.labelKey) : selectedSpot.type}
            </span>
            <h2 className="text-[17px] font-extrabold text-ink">{selectedSpot.name}</h2>
            {selectedDescription && (
              <p className={`text-sm leading-normal text-ink-2 ${isSheetExpanded ? '' : 'line-clamp-2'}`}>{selectedDescription}</p>
            )}
            {isSheetExpanded && warningBox}
            {isSheetExpanded && selectedSpot.author && (
              <p className="text-[13px] text-ink-3">{t('spot_pilot_label')} <strong className="text-[#e2e8f0]">{selectedSpot.author}</strong></p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                aria-expanded={isSheetExpanded}
                onClick={() => setIsSheetExpanded((open) => !open)}
                className={`${SECONDARY} h-11 flex-1`}
              >
                {isSheetExpanded ? t('spot_less') : t('spot_details')}
              </button>
              <a href={routeUrl(selectedSpot)} target="_blank" rel="noopener noreferrer" className={`${PRIMARY} h-11 flex-1`}>
                {t('spot_route')}
              </a>
            </div>
          </section>
        )}
      </div>

      {/* --- Add spot dialog: the shared Modal owns focus, Escape and scroll lock. --- */}
      <Modal
        isOpen={showAddModal && Boolean(newCoords)}
        onClose={() => setShowAddModal(false)}
        title={t('spot_add_title')}
        busy={isSubmitting}
        size="max-w-md"
      >
        <form onSubmit={handleAddSpot} className="flex flex-col gap-4 p-5">
          <div>
            <label htmlFor="spot-name" className={LABEL}>{t('spot_field_name')}</label>
            <input id="spot-name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={INPUT} placeholder={t('spot_field_name_placeholder')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="spot-type" className={LABEL}>{t('spot_field_type')}</label>
              <select id="spot-type" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className={INPUT}>
                {SPOT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{t(type.labelKey)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="spot-author" className={LABEL}>{t('spot_field_author')}</label>
              <input id="spot-author" required value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className={INPUT} placeholder={t('spot_field_author_placeholder')} />
            </div>
          </div>

          <div>
            <label htmlFor="spot-desc" className={LABEL}>{t('spot_field_desc')}</label>
            <textarea id="spot-desc" required value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} className={`${INPUT} min-h-[80px]`} placeholder={t('spot_field_desc_placeholder')} />
          </div>

          <div>
            <label htmlFor="spot-warnings" className={LABEL}>{t('spot_field_warnings')}</label>
            <textarea id="spot-warnings" value={formData.warnings} onChange={e => setFormData({ ...formData, warnings: e.target.value })} className={`${INPUT} min-h-[60px]`} placeholder={t('spot_field_warnings_placeholder')} />
          </div>

          <button type="submit" disabled={isSubmitting} className={`${PRIMARY} mt-2 h-11`}>
            {isSubmitting ? t('action_saving') : t('spot_save')}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default SpotMap;
