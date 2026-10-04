import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { APIProvider, AdvancedMarker, Map, useMap, type MapMouseEvent } from '@vis.gl/react-google-maps';
import { Navigation, Plus, X } from 'lucide-react';
import PageHeader from './PageHeader';
import { SPOT_TYPES, spotTypeOf } from '../constants/spots';
import { useToast } from '../contexts/useToast';
import { useLanguage } from '../contexts/useLanguage';
import { usePointWeather, VERDICT_STYLE } from '../hooks/useFlightWeather';
import { apiService } from '../services/apiService';
import { compressImageFile, type ProcessedImage } from '../services/storageService';
import type { Spot, SpotStatus, SpotType, User } from '../types';
import {
  canManageSpot,
  filterSpots,
  formatCoords,
  orderedSpotTypes,
  primarySpotType,
  spotFieldsFromForm,
  spotImageUrl,
  spotSharePath,
  spotTypeIds,
} from '../utils/spotMap';

/**
 * The key is a public client key, restricted by HTTP referrer in Google Cloud.
 * `mapId` is required for AdvancedMarker; without one the pins never render.
 */
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const MAPS_ID = (import.meta.env.VITE_GOOGLE_MAPS_ID as string | undefined) || 'DEMO_MAP_ID';
const TBILISI = { lat: 41.7151, lng: 44.8271 };
const ACCENT = '#2dd4bf';

const INPUT = 'w-full rounded-[10px] border border-white/10 bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-accent/50 focus:outline-none';
const LABEL = 'mb-1 block text-xs font-bold text-ink-3';
const PRIMARY = 'flex items-center justify-center gap-2 rounded-[10px] bg-accent-fill text-sm font-bold text-white transition-colors duration-150 hover:bg-accent-fill-hover active:bg-accent-fill-active disabled:opacity-60';
const SECONDARY = 'flex items-center justify-center rounded-[10px] border border-white/[0.12] text-sm font-bold text-ink transition-colors duration-150 hover:bg-white/5 disabled:opacity-60';

const MAX_SPOT_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface SpotFormState {
  name: string;
  types: SpotType[];
  desc: string;
  warnings: string;
  author: string;
  status: SpotStatus;
  parking: boolean;
  power: boolean;
}

const EMPTY_FORM: SpotFormState = {
  name: '',
  types: ['bando'],
  desc: '',
  warnings: '',
  author: '',
  status: 'open',
  parking: false,
  power: false,
};

interface CameraTarget {
  lat: number;
  lng: number;
  zoom: number;
  token: number;
}

interface SpotMapProps {
  currentUser?: User | null;
  onLoginClick?: () => void;
}

/** A static pin. The selected spot is the accent; a closed spot stays on the map, dimmed. */
const SpotPin: React.FC<{ type: string; selected: boolean; closed?: boolean }> = ({ type, selected, closed = false }) => (
  <span
    className={`block rounded-full border-bg ${selected ? 'h-[22px] w-[22px] border-[3px]' : 'h-4 w-4 border-2'} ${closed ? 'opacity-50' : ''}`}
    style={{
      backgroundColor: selected ? ACCENT : (spotTypeOf(type)?.color ?? ACCENT),
      boxShadow: selected ? `0 0 0 2px ${ACCENT}` : undefined,
    }}
  />
);

const HerePin: React.FC = () => (
  <span className="block h-4 w-4 rounded-full border-[3px] border-accent bg-bg" />
);

const MapFlyTo: React.FC<{ camera: CameraTarget | null }> = ({ camera }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !camera) return;
    map.panTo({ lat: camera.lat, lng: camera.lng });
    map.setZoom(camera.zoom);
  }, [map, camera]);
  return null;
};

const RulesNote: React.FC = () => {
  const { t } = useLanguage();
  return (
    <p className="text-[12px] leading-relaxed text-ink-3">
      {t('spot_rules_note')}{' '}
      <Link to="/regulations" className="font-bold text-accent hover:underline">{t('preflight_regulations_link')}</Link>
    </p>
  );
};

/** A drag event hands back a class; a map click hands back `{ lat, lng }`. */
interface LatLngLike {
  lat: number | (() => number);
  lng: number | (() => number);
}

const readLatLng = (
  latLng: LatLngLike | null | undefined,
): { lat: number; lng: number } | null => {
  if (!latLng) return null;
  const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
  const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const SpotMap: React.FC<SpotMapProps> = ({ currentUser = null, onLoginClick }) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();
  const requestedId = params.get('spot');

  const [spots, setSpots] = useState<Spot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [newCoords, setNewCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [formData, setFormData] = useState<SpotFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<ProcessedImage | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState('');
  const [camera, setCamera] = useState<CameraTarget | null>(null);

  const flyToken = useRef(0);
  const draggingPin = useRef(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const weatherLat = selectedSpot
    ? Number(selectedSpot.lat)
    : (myLocation?.lat ?? null);
  const weatherLng = selectedSpot
    ? Number(selectedSpot.lng)
    : (myLocation?.lng ?? null);
  const pointWeather = usePointWeather(
    weatherLat !== null && Number.isFinite(weatherLat) ? weatherLat : null,
    weatherLng !== null && Number.isFinite(weatherLng) ? weatherLng : null,
  );

  const flyTo = useCallback((lat: number, lng: number, zoom: number) => {
    flyToken.current += 1;
    setCamera({ lat, lng, zoom, token: flyToken.current });
  }, []);

  const setSpotParam = useCallback((id: string | null) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('spot', id);
      else next.delete('spot');
      return next;
    }, { replace: true });
  }, [setParams]);

  const fetchSpots = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      setSpots(await apiService.getSpots());
    } catch (error) {
      console.error('Error fetching spots:', error);
      showToast(t('spots_load_failed'), 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => { void fetchSpots(); }, [fetchSpots]);

  useEffect(() => {
    if (!requestedId || selectedSpot?.id === requestedId) return;
    const spot = spots.find((item) => item.id === requestedId);
    if (!spot) return;
    setSelectedSpot(spot);
    flyTo(Number(spot.lat), Number(spot.lng), 15);
  }, [requestedId, spots, selectedSpot?.id, flyTo]);

  const filteredSpots = filterSpots(spots, activeFilter, query);
  const sortedSpots = [...filteredSpots].sort((a, b) => a.name.localeCompare(b.name, language === 'ka' ? 'ka' : 'en'));
  const countOf = (typeId: string) => filterSpots(spots, typeId, query).length;
  const markerSpots = selectedSpot && !filteredSpots.some((spot) => spot.id === selectedSpot.id)
    ? [...filteredSpots, selectedSpot]
    : filteredSpots;
  const shownSpots = editingId ? markerSpots.filter((spot) => spot.id !== editingId) : markerSpots;
  const draftType = primarySpotType(formData.types);
  const draftPreview = photoPreview || existingImage;

  const copyText = async (value: string, okKey: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(t(okKey));
    } catch (error) {
      console.error('Copy failed:', error);
      showToast(t('share_link_failed'), 'error');
    }
  };

  const locate = () => {
    if (!navigator.geolocation) {
      showToast(t('geo_unsupported'), 'error');
      return;
    }
    setLocating(true);
    const placing = isPickingLocation;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        setMyLocation(next);
        flyTo(next.lat, next.lng, 15);
        if (placing) setNewCoords(next);
        setLocating(false);
      },
      (error) => {
        console.error('Geolocation failed:', error);
        showToast(t('geo_failed'), 'error');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 },
    );
  };

  const handleMapClick = (event: MapMouseEvent) => {
    if (!isPickingLocation || draggingPin.current || !event.detail.latLng) return;
    setNewCoords({ lat: event.detail.latLng.lat, lng: event.detail.latLng.lng });
  };

  const moveDraft = (latLng: LatLngLike | null) => {
    const next = readLatLng(latLng);
    if (next) setNewCoords(next);
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setExistingImage('');
  };

  const selectSpot = (spot: Spot) => {
    setIsPickingLocation(false);
    setEditingId(null);
    setNewCoords(null);
    setIsListOpen(false);
    setIsSheetExpanded(false);
    setConfirmDelete(false);
    setSelectedSpot(spot);
    setSpotParam(spot.id);
    flyTo(Number(spot.lat), Number(spot.lng), 15);
  };

  const closeSpot = () => {
    setSelectedSpot(null);
    setIsSheetExpanded(false);
    setConfirmDelete(false);
    setSpotParam(null);
  };

  const startAddSpot = () => {
    if (!currentUser) {
      showToast(t('spot_add_needs_auth'), 'error');
      onLoginClick?.();
      return;
    }
    setSelectedSpot(null);
    setSpotParam(null);
    setIsListOpen(false);
    setConfirmDelete(false);
    setEditingId(null);
    clearPhoto();
    setIsPickingLocation(true);
    setNewCoords(null);
    setFormData({ ...EMPTY_FORM, author: currentUser.name });
  };

  const startEdit = (spot: Spot) => {
    if (!canManageSpot(spot, currentUser)) return;
    const types = orderedSpotTypes(spotTypeIds(spot));
    setEditingId(spot.id);
    setConfirmDelete(false);
    setIsListOpen(false);
    setIsSheetExpanded(false);
    clearPhoto();
    setExistingImage(spotImageUrl(spot.image));
    setFormData({
      name: spot.name,
      types: types.length > 0 ? types : ['bando'],
      desc: spot.description || spot.desc || '',
      warnings: spot.warnings || '',
      author: spot.author || '',
      status: spot.status === 'closed' ? 'closed' : 'open',
      parking: Boolean(spot.parking),
      power: Boolean(spot.power),
    });
    setNewCoords({ lat: Number(spot.lat), lng: Number(spot.lng) });
    setIsPickingLocation(true);
    flyTo(Number(spot.lat), Number(spot.lng), 15);
  };

  const cancelDraft = () => {
    if (isSubmitting) return;
    setIsPickingLocation(false);
    setEditingId(null);
    setNewCoords(null);
    clearPhoto();
  };

  const onPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      showToast(t('upload_wrong_type'), 'error');
      return;
    }
    if (file.size > MAX_SPOT_PHOTO_BYTES) {
      showToast(t('spot_photo_too_large'), 'error');
      return;
    }
    try {
      const processed = await compressImageFile(file);
      setPhoto(processed);
      setPhotoPreview(URL.createObjectURL(processed.file));
    } catch (error) {
      console.error('Spot photo failed:', error);
      showToast(t('spot_photo_failed'), 'error');
    }
  };

  const toggleType = (id: SpotType) => {
    setFormData((prev) => {
      const has = prev.types.includes(id);
      if (has && prev.types.length === 1) return prev;
      const types = has ? prev.types.filter((type) => type !== id) : [...prev.types, id];
      return { ...prev, types };
    });
  };

  const finishDraft = (saved: Spot) => {
    setIsPickingLocation(false);
    setEditingId(null);
    setNewCoords(null);
    setFormData(EMPTY_FORM);
    clearPhoto();
    setSpots((prev) => {
      const exists = prev.some((item) => item.id === saved.id);
      return exists ? prev.map((item) => (item.id === saved.id ? { ...item, ...saved } : item)) : [saved, ...prev];
    });
    setSelectedSpot(saved);
    setSpotParam(saved.id);
    flyTo(saved.lat, saved.lng, 15);
  };

  const handleSaveSpot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCoords) return;
    if (!currentUser) {
      showToast(t('spot_add_needs_auth'), 'error');
      onLoginClick?.();
      return;
    }
    setIsSubmitting(true);
    try {
      let image = existingImage;
      if (photo) {
        try {
          const uploaded = await apiService.uploadImageWithMeta(photo, `spots/${currentUser.id}`);
          image = uploaded.url;
        } catch (error) {
          console.error('Spot photo upload failed:', error);
          showToast(t('spot_photo_failed'), 'error');
          return;
        }
      }
      const fields = spotFieldsFromForm(formData, newCoords, image);
      if (editingId) {
        await apiService.updateSpot(editingId, fields);
        const previous = spots.find((item) => item.id === editingId) ?? selectedSpot;
        finishDraft({
          id: editingId,
          author: previous?.author,
          authorId: previous?.authorId,
          createdAt: previous?.createdAt,
          desc: undefined,
          ...fields,
        });
      } else {
        const created = await apiService.addSpot({ ...fields, author: formData.author }, currentUser);
        finishDraft({
          id: created.id,
          author: formData.author.trim() || currentUser.name,
          authorId: currentUser.id,
          ...fields,
        });
      }
      await fetchSpots(true);
    } catch (error) {
      console.error('Error saving spot:', error);
      showToast(t(editingId ? 'spot_update_failed' : 'spot_add_failed'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSpot = async () => {
    if (!selectedSpot || isDeleting || !canManageSpot(selectedSpot, currentUser)) return;
    setIsDeleting(true);
    try {
      const id = selectedSpot.id;
      await apiService.deleteSpot(id);
      setSpots((prev) => prev.filter((item) => item.id !== id));
      closeSpot();
      await fetchSpots(true);
    } catch (error) {
      console.error('Error deleting spot:', error);
      showToast(t('spot_delete_failed'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const weatherValue = (value: number | undefined) => (
    !pointWeather.loading && value !== undefined ? String(value) : '—'
  );
  const verdictStyle = VERDICT_STYLE[pointWeather.verdict];

  const weatherBlock = (titleKey?: string) => (
    <div className="rounded-[10px] border border-line bg-bg px-3 py-2.5">
      {titleKey && <p className="mb-1.5 text-xs font-bold text-ink-3">{t(titleKey)}</p>}
      <p className={`inline-flex rounded-md px-2 py-0.5 text-xs font-extrabold ${pointWeather.loading ? 'bg-surface-2 text-ink-2' : verdictStyle.className}`}>
        {pointWeather.loading ? t('state_loading') : t(verdictStyle.labelKey)}
      </p>
      <p className="mt-1.5 text-[13px] leading-normal text-ink-2">
        {t('spot_weather_line', {
          temp: weatherValue(pointWeather.weather?.temp),
          wind: weatherValue(pointWeather.weather?.wind),
          gusts: weatherValue(pointWeather.weather?.gusts),
          rain: weatherValue(pointWeather.weather?.rain),
        })}
      </p>
      {!pointWeather.loading && pointWeather.weather && (
        <p className="mt-1 text-[13px] text-ink-3">
          {pointWeather.weather.isNight ? t('weather_sunrise') : t('weather_sunset')}{' '}
          <span className="font-bold tabular-nums text-ink">{pointWeather.weather.sunTime.slice(0, 5)}</span>
        </p>
      )}
    </div>
  );

  const searchInput = () => (
    <input
      type="search"
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      aria-label={t('spot_search_label')}
      placeholder={t('spot_search_placeholder')}
      className={`${INPUT} h-10`}
    />
  );

  const filterChips = (scroll: boolean) => (
    <div
      role="group"
      aria-label={t('spots_filter_label')}
      className={scroll ? 'scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4' : 'flex flex-wrap gap-1.5'}
    >
      <button
        type="button"
        aria-pressed={activeFilter === 'all'}
        onClick={() => setActiveFilter('all')}
        className={`flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-[13px] ${activeFilter === 'all' ? 'bg-accent-tint font-bold text-accent' : 'border border-white/10 text-ink-2'}`}
      >
        {t('filter_all')}
        <span className="text-xs text-ink-3">{countOf('all')}</span>
      </button>
      {SPOT_TYPES.map((type) => {
        const active = activeFilter === type.id;
        return (
          <button
            key={type.id}
            type="button"
            aria-pressed={active}
            onClick={() => setActiveFilter(type.id)}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-[13px] ${active ? 'bg-accent-tint font-bold text-accent' : 'border border-white/10 text-ink-2'}`}
          >
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: type.color }} />
            {t(type.shortKey)}
            <span className="text-xs text-ink-3">{countOf(type.id)}</span>
          </button>
        );
      })}
    </div>
  );

  const spotNote = (spot: Spot) => [spot.status === 'closed' ? t('spot_status_closed') : '', spot.warnings ?? ''].filter((part) => part !== '').join(' · ');

  const spotList = () => (
    <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
      {sortedSpots.length === 0 && (
        <li className="px-2 py-3 text-sm text-ink-3">{isLoading ? t('state_loading') : t('spot_list_empty')}</li>
      )}
      {sortedSpots.map((spot) => {
        const selected = selectedSpot?.id === spot.id;
        return (
          <li key={spot.id}>
            <button
              type="button"
              onClick={() => selectSpot(spot)}
              className={`flex w-full items-start gap-2 rounded-[10px] px-2 py-2 text-left ${selected ? 'bg-accent-tint' : 'hover:bg-white/5'}`}
            >
              <span
                aria-hidden="true"
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${spot.status === 'closed' ? 'opacity-50' : ''}`}
                style={{ backgroundColor: spotTypeOf(spot.type)?.color ?? ACCENT }}
              />
              <span className="min-w-0">
                <span className={`block truncate text-sm font-bold ${selected ? 'text-accent' : 'text-ink'}`}>{spot.name}</span>
                {spotNote(spot) && (
                  <span className={`block truncate text-xs ${spot.status === 'closed' ? 'text-[#fcd34d]' : 'text-ink-3'}`}>{spotNote(spot)}</span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const selectedDescription = selectedSpot ? (selectedSpot.description || selectedSpot.desc) : undefined;
  const selectedImage = selectedSpot ? spotImageUrl(selectedSpot.image) : '';
  const managesSelected = selectedSpot ? canManageSpot(selectedSpot, currentUser) : false;
  const showHere = Boolean(myLocation) && !selectedSpot && !isPickingLocation;

  const pickBanner = () => isPickingLocation && !newCoords && (
    <div className="flex items-center gap-2 rounded-[10px] bg-warn px-3 py-2 text-[13px] font-bold text-[#451a03]">
      <span className="min-w-0 flex-1">{t('spot_pick_hint')}</span>
      <button type="button" onClick={locate} disabled={locating} className="shrink-0 rounded-md px-2 py-1 hover:bg-black/10 disabled:opacity-60">
        {t('spot_locate')}
      </button>
      <button type="button" aria-label={t('action_cancel')} onClick={cancelDraft} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-black/10">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className="relative -mx-4 -mb-4 -mt-6 flex h-[calc(100dvh-4rem)] overflow-hidden md:m-0 md:h-full md:rounded-2xl md:border md:border-line">
      <div className="hidden w-[300px] shrink-0 flex-col gap-3 border-r border-line bg-surface p-4 md:flex md:min-h-0">
        <PageHeader title={t('spots_title')} subtitle={t('spots_subtitle')} size="panel" />
        {searchInput()}
        {filterChips(false)}
        {spotList()}
        <RulesNote />
        <button type="button" onClick={locate} disabled={locating} className={`${SECONDARY} h-11`}>
          <Navigation size={16} aria-hidden="true" /> {t('spot_locate')}
        </button>
        <button type="button" onClick={startAddSpot} disabled={isPickingLocation} className={`${PRIMARY} h-11`}>
          <Plus size={16} aria-hidden="true" /> {t('spot_add')}
        </button>
      </div>

      <div className={`relative flex-1 bg-[#0b1324] ${isPickingLocation ? 'cursor-crosshair' : ''}`}>
        <div className="absolute inset-x-0 top-0 z-[400] flex flex-col gap-2.5 bg-bg/[0.92] px-4 py-3.5 md:hidden">
          <div className="flex items-center justify-between gap-2">
            <h1 className="min-w-0 truncate text-lg font-extrabold text-ink">{t('spots_title')}</h1>
            <button
              type="button"
              aria-label={t('spot_locate')}
              onClick={locate}
              disabled={locating}
              className={`${SECONDARY} h-11 w-11`}
            >
              <Navigation size={18} aria-hidden="true" />
            </button>
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
          {searchInput()}
          {filterChips(true)}
          {pickBanner()}
        </div>

        {isPickingLocation && !newCoords && (
          <div className="absolute left-1/2 top-5 z-[500] hidden -translate-x-1/2 md:block">
            {pickBanner()}
          </div>
        )}

        {!MAPS_API_KEY ? (
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
              colorScheme="DARK"
              gestureHandling="greedy"
              disableDefaultUI
              zoomControl
              onClick={handleMapClick}
              className="h-full w-full"
            >
              <MapFlyTo camera={camera} />
              {!isLoading && shownSpots.map((spot) => (
                <AdvancedMarker
                  key={spot.id}
                  position={{ lat: Number(spot.lat), lng: Number(spot.lng) }}
                  title={spot.name}
                  zIndex={selectedSpot?.id === spot.id ? 10 : 1}
                  onClick={() => {
                    if (!isPickingLocation) selectSpot(spot);
                  }}
                >
                  <SpotPin type={spot.type} selected={selectedSpot?.id === spot.id} closed={spot.status === 'closed'} />
                </AdvancedMarker>
              ))}
              {myLocation && (
                <AdvancedMarker position={myLocation} title={t('spot_you_are_here')} zIndex={5}>
                  <HerePin />
                </AdvancedMarker>
              )}
              {isPickingLocation && newCoords && (
                <AdvancedMarker
                  position={newCoords}
                  draggable
                  zIndex={20}
                  title={t(editingId ? 'spot_edit_title' : 'spot_add_title')}
                  onDragStart={() => { draggingPin.current = true; }}
                  onDrag={(event) => moveDraft(event.latLng)}
                  onDragEnd={(event) => {
                    moveDraft(event.latLng);
                    window.setTimeout(() => { draggingPin.current = false; }, 300);
                  }}
                >
                  <SpotPin type={draftType} selected closed={formData.status === 'closed'} />
                </AdvancedMarker>
              )}
            </Map>
          </APIProvider>
        )}

        {showHere && (
          <section aria-label={t('spot_weather_here')} className="absolute right-5 top-5 z-[400] hidden w-[300px] md:block">
            {weatherBlock('spot_weather_here')}
          </section>
        )}

        {selectedSpot && !isPickingLocation && (
          <section
            aria-label={selectedSpot.name}
            className="absolute inset-x-0 bottom-0 z-[400] flex max-h-[72%] flex-col gap-2 overflow-y-auto rounded-t-2xl border-t border-line bg-surface px-4 pb-5 pt-2.5 md:inset-x-auto md:bottom-auto md:right-5 md:top-5 md:max-h-[calc(100%-2.5rem)] md:w-[320px] md:rounded-2xl md:border md:p-4"
          >
            <button
              type="button"
              aria-label={t('action_close')}
              onClick={closeSpot}
              className="flex h-6 items-center justify-center self-center md:hidden"
            >
              <span aria-hidden="true" className="h-1 w-10 rounded-full bg-[#334155]" />
            </button>
            {selectedImage && (
              <img src={selectedImage} alt="" className="h-36 w-full rounded-[10px] object-cover" />
            )}
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1">
                {spotTypeIds(selectedSpot).map((id) => {
                  const known = spotTypeOf(id);
                  return (
                    <span key={id} className="text-xs font-bold" style={{ color: known?.color ?? ACCENT }}>
                      {known ? t(known.labelKey) : id}
                    </span>
                  );
                })}
              </div>
              <button
                type="button"
                aria-label={t('action_close')}
                onClick={closeSpot}
                className="hidden h-8 w-8 items-center justify-center rounded-lg text-ink-2 hover:bg-white/5 hover:text-ink md:flex"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <h2 className="text-[17px] font-extrabold text-ink">{selectedSpot.name}</h2>
            {selectedDescription && (
              <p className={`text-sm leading-normal text-ink-2 ${isSheetExpanded ? '' : 'line-clamp-3 md:line-clamp-none'}`}>{selectedDescription}</p>
            )}
            {selectedSpot.status === 'closed' && (
              <div className="rounded-[10px] border border-warn/25 bg-warn/10 px-3 py-2.5 text-[13px] font-bold text-[#fcd34d]">
                {t('spot_status_closed')}
              </div>
            )}
            {(selectedSpot.parking || selectedSpot.power) && (
              <p className="text-[13px] text-ink-2">
                {[selectedSpot.parking ? t('spot_parking') : '', selectedSpot.power ? t('spot_power') : ''].filter(Boolean).join(' · ')}
              </p>
            )}
            {selectedSpot.warnings && (
              <div className="rounded-[10px] border border-warn/25 bg-warn/10 px-3 py-2.5 text-[13px] leading-normal text-[#fcd34d]">
                <strong>{t('spot_warning_label')}</strong> {selectedSpot.warnings}
              </div>
            )}
            {weatherBlock()}
            <div>
              <p className="text-xs font-bold text-ink-3">{t('spot_coords_label')}</p>
              <p className="text-sm tabular-nums text-ink">{formatCoords(Number(selectedSpot.lat), Number(selectedSpot.lng))}</p>
            </div>
            {selectedSpot.author && (
              <p className="text-[13px] text-ink-3">{t('spot_pilot_label')} <strong className="text-ink">{selectedSpot.author}</strong></p>
            )}
            <RulesNote />
            <div className="flex flex-wrap gap-2">
              {selectedDescription && (
                <button
                  type="button"
                  aria-expanded={isSheetExpanded}
                  onClick={() => setIsSheetExpanded((open) => !open)}
                  className={`${SECONDARY} h-10 px-3 md:hidden`}
                >
                  {isSheetExpanded ? t('spot_less') : t('spot_details')}
                </button>
              )}
              <button
                type="button"
                onClick={() => copyText(formatCoords(Number(selectedSpot.lat), Number(selectedSpot.lng)), 'spot_coords_copied')}
                className={`${SECONDARY} h-10 px-3`}
              >
                {t('spot_copy_coords')}
              </button>
              <button
                type="button"
                onClick={() => copyText(`${window.location.origin}${spotSharePath(selectedSpot.id)}`, 'share_link_copied')}
                className={`${SECONDARY} h-10 px-3`}
              >
                {t('spot_share')}
              </button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.lat},${selectedSpot.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${PRIMARY} h-10 px-3`}
              >
                {t('spot_route')}
                <span className="sr-only"> {t('link_opens_new_tab')}</span>
              </a>
              {managesSelected && (
                <button type="button" onClick={() => startEdit(selectedSpot)} className={`${SECONDARY} h-10 px-3`}>
                  {t('action_edit')}
                </button>
              )}
              {managesSelected && confirmDelete && (
                <>
                  <span className="flex h-10 items-center text-[13px] font-bold text-ink">{t('spot_delete_question')}</span>
                  <button type="button" onClick={handleDeleteSpot} disabled={isDeleting} className="h-10 rounded-[10px] bg-bad px-3 text-sm font-bold text-white disabled:opacity-60">
                    {t('delete_confirm_yes')}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} disabled={isDeleting} className={`${SECONDARY} h-10 px-3`}>
                    {t('action_cancel')}
                  </button>
                </>
              )}
              {managesSelected && !confirmDelete && (
                <button type="button" onClick={() => setConfirmDelete(true)} className="h-10 rounded-[10px] border border-bad/40 px-3 text-sm font-bold text-bad">
                  {t('action_delete')}
                </button>
              )}
            </div>
          </section>
        )}

        {!selectedSpot && !isPickingLocation && (
          <section className="absolute inset-x-0 bottom-0 z-[400] flex max-h-[55%] min-h-0 flex-col gap-2 rounded-t-2xl border-t border-line bg-surface px-4 pb-4 pt-3 md:hidden">
            {showHere && weatherBlock('spot_weather_here')}
            <button
              type="button"
              aria-expanded={isListOpen}
              onClick={() => setIsListOpen((open) => !open)}
              className={`${SECONDARY} h-11 shrink-0`}
            >
              {t('spot_list_toggle', { count: sortedSpots.length })}
            </button>
            {isListOpen && spotList()}
            {isListOpen && <RulesNote />}
          </section>
        )}

        {isPickingLocation && newCoords && (
          <section className="absolute inset-x-0 bottom-0 z-[450] max-h-[78%] overflow-y-auto rounded-t-2xl border-t border-line bg-surface px-4 pb-5 pt-3 md:inset-x-auto md:bottom-auto md:right-5 md:top-5 md:max-h-[calc(100%-2.5rem)] md:w-[340px] md:rounded-2xl md:border md:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-ink">{t(editingId ? 'spot_edit_title' : 'spot_add_title')}</h2>
              <button type="button" aria-label={t('action_cancel')} onClick={cancelDraft} disabled={isSubmitting} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 hover:bg-white/5 hover:text-ink disabled:opacity-60">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSaveSpot} className="flex flex-col gap-3">
              <div>
                <p className={LABEL}>{t('spot_coords_label')}</p>
                <p className="text-sm tabular-nums text-ink">{formatCoords(newCoords.lat, newCoords.lng)}</p>
                <p className="mt-1 text-[13px] leading-normal text-ink-3">{t('spot_drag_hint')}</p>
              </div>
              <div>
                <label htmlFor="spot-name" className={LABEL}>{t('spot_field_name')}</label>
                <input id="spot-name" required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className={INPUT} placeholder={t('spot_field_name_placeholder')} />
              </div>
              <div>
                <p className={LABEL}>{t('spot_types_label')}</p>
                <div role="group" aria-label={t('spot_types_label')} className="flex flex-wrap gap-1.5">
                  {SPOT_TYPES.map((type) => {
                    const active = formData.types.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleType(type.id)}
                        className={`flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-[13px] ${active ? 'bg-accent-tint font-bold text-accent' : 'border border-white/10 text-ink-2'}`}
                      >
                        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: type.color }} />
                        {t(type.shortKey)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className={LABEL}>{t('spot_status_label')}</p>
                <div role="group" aria-label={t('spot_status_label')} className="grid grid-cols-2 gap-2">
                  <button type="button" aria-pressed={formData.status === 'open'} onClick={() => setFormData({ ...formData, status: 'open' })} className={`${formData.status === 'open' ? 'bg-accent-tint font-bold text-accent' : 'border border-white/10 text-ink-2'} min-h-11 rounded-[10px] px-2 text-[13px]`}>
                    {t('spot_status_open')}
                  </button>
                  <button type="button" aria-pressed={formData.status === 'closed'} onClick={() => setFormData({ ...formData, status: 'closed' })} className={`${formData.status === 'closed' ? 'bg-warn/15 font-bold text-[#fcd34d]' : 'border border-white/10 text-ink-2'} min-h-11 rounded-[10px] px-2 text-[13px]`}>
                    {t('spot_status_closed')}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" aria-pressed={formData.parking} onClick={() => setFormData({ ...formData, parking: !formData.parking })} className={`${formData.parking ? 'bg-accent-tint font-bold text-accent' : 'border border-white/10 text-ink-2'} h-11 rounded-[10px] px-2 text-[13px]`}>
                  {t('spot_parking')}
                </button>
                <button type="button" aria-pressed={formData.power} onClick={() => setFormData({ ...formData, power: !formData.power })} className={`${formData.power ? 'bg-accent-tint font-bold text-accent' : 'border border-white/10 text-ink-2'} h-11 rounded-[10px] px-2 text-[13px]`}>
                  {t('spot_power')}
                </button>
              </div>
              <div>
                <p className={LABEL}>{t('spot_photo_label')}</p>
                {draftPreview && <img src={draftPreview} alt="" className="mb-2 h-28 w-full rounded-[10px] object-cover" />}
                <div className="flex flex-wrap gap-2">
                  <input ref={photoInputRef} id="spot-photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={onPhoto} />
                  <button type="button" onClick={() => photoInputRef.current?.click()} className={`${SECONDARY} h-10 px-3`}>
                    {draftPreview ? t('spot_photo_change') : t('spot_photo_add')}
                  </button>
                  {draftPreview && (
                    <button type="button" onClick={clearPhoto} className={`${SECONDARY} h-10 px-3`}>
                      {t('spot_photo_remove')}
                    </button>
                  )}
                </div>
              </div>
              {!editingId && (
                <div>
                  <label htmlFor="spot-author" className={LABEL}>{t('spot_field_author')}</label>
                  <input id="spot-author" required value={formData.author} onChange={(event) => setFormData({ ...formData, author: event.target.value })} className={INPUT} placeholder={t('spot_field_author_placeholder')} />
                </div>
              )}
              <div>
                <label htmlFor="spot-desc" className={LABEL}>{t('spot_field_desc')}</label>
                <textarea id="spot-desc" required value={formData.desc} onChange={(event) => setFormData({ ...formData, desc: event.target.value })} className={`${INPUT} min-h-[72px]`} placeholder={t('spot_field_desc_placeholder')} />
              </div>
              <div>
                <label htmlFor="spot-warnings" className={LABEL}>{t('spot_field_warnings')}</label>
                <textarea id="spot-warnings" value={formData.warnings} onChange={(event) => setFormData({ ...formData, warnings: event.target.value })} className={`${INPUT} min-h-[56px]`} placeholder={t('spot_field_warnings_placeholder')} />
              </div>
              <button type="submit" disabled={isSubmitting} className={`${PRIMARY} h-11`}>
                {isSubmitting ? t('action_saving') : t('spot_save')}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
};

export default SpotMap;
