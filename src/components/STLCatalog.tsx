import React, { useState, useMemo, useEffect } from 'react';
import { Box, Download, Search, User, Cuboid, Loader2, Info, Layers } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import { STL_AUTHORS } from '../constants/toolsData';
import { SCAT_STL_CATALOG } from '../constants/stlCatalogData';
import { apiService } from '../services/apiService';
import { formatShortDate } from '../utils/dates';
import Modal from './Modal';
import type { StlFile } from '../types';

const STLCatalog: React.FC = () => {
  const { t } = useLanguage();

  // --- STATE ---
  const [items, setItems] = useState<StlFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filterType, setFilterType] = useState('All');
  const [filterFrame, setFilterFrame] = useState('All');
  const [filterAuthor, setFilterAuthor] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Modal State for viewing full details & 3D print specs
  const [selectedItem, setSelectedItem] = useState<StlFile | null>(null);

  // --- FETCH DATA (Firestore + SCAT catalog) ---
  useEffect(() => {
    let cancelled = false;

    const fetchItems = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const firestoreData = await apiService.getSTLFiles();
        if (cancelled) return;

        // Merge Firestore items with the built-in SCAT catalog
        const firestoreList = Array.isArray(firestoreData) ? firestoreData : [];
        const scatItems = SCAT_STL_CATALOG as StlFile[];

        // Combine: Firestore items first, then SCAT items (avoiding duplicates by id)
        // All authors are set to DronehubGe
        const firestoreIds = new Set(firestoreList.map(item => item.id));
        const merged: StlFile[] = [
          ...firestoreList.map(item => ({ ...item, author: 'DronehubGe' })),
          ...scatItems.filter(item => !firestoreIds.has(item.id)).map(item => ({ ...item, author: 'DronehubGe' }))
        ];

        setItems(merged);
      } catch (error) {
        console.warn('Error fetching STL files from Firestore, fallback to SCAT catalog:', error);
        if (!cancelled) {
          setItems((SCAT_STL_CATALOG as StlFile[]).map(item => ({ ...item, author: 'DronehubGe' })));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchItems();
    return () => { cancelled = true; };
  }, [reloadToken, t]);

  // Options come from the loaded items. Seeding them from STL_TYPES / STL_FRAMES
  // offered English labels that match nothing in the Georgian catalog.
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    items.forEach(item => { if (item.type) set.add(item.type); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ka'));
  }, [items]);

  const availableFrames = useMemo(() => {
    const set = new Set<string>();
    items.forEach(item => { if (item.frame) set.add(item.frame); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ka'));
  }, [items]);

  const availableAuthors = useMemo(() => {
    const set = new Set<string>(STL_AUTHORS);
    items.forEach(item => { if (item.author) set.add(item.author); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  // --- FILTERING ---
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter(item => {
      const matchType = filterType === 'All' || item.type === filterType;
      const matchFrame = filterFrame === 'All' || item.frame === filterFrame;
      const matchAuthor = filterAuthor === 'All' || item.author === filterAuthor;
      
      const matchSearch = !q ||
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.frame?.toLowerCase().includes(q) ||
        item.author?.toLowerCase().includes(q) ||
        item.type?.toLowerCase().includes(q) ||
        item.material?.toLowerCase().includes(q);
      
      return matchType && matchFrame && matchAuthor && matchSearch;
    });
  }, [items, filterType, filterFrame, filterAuthor, searchQuery]);

  // --- SAFE DOWNLOAD FUNCTION ---
  const handleDownload = async (e: React.MouseEvent, url: string, filename: string, itemId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!url) return;

    // For external files (e.g. stl.vtx.in.ua or github), trigger direct download link to avoid CORS blocks
    const isFirebaseStorage = url.startsWith('https://firebasestorage.googleapis.com/');
    if (!isFirebaseStorage) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = `${filename.replace(/[\s/\\?%*:|"<>]+/g, '_')}.stl`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    setDownloadingId(itemId);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${filename.replace(/[\s/\\?%*:|"<>]+/g, '_')}.stl`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.warn("Download failed, opening in new tab instead", error);
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-6 space-y-8 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent-tint rounded-2xl text-accent border border-accent/30">
            <Box size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">
              {t('stl_title') || '3D Print Catalog'}
            </h2>
            <p className="text-sm text-ink-3 font-medium">
              {t('stl_desc') || 'STL files for drone parts'}
            </p>
          </div>
        </div>
        <p className="text-xs font-bold text-ink-3">
          {filteredItems.length} / {items.length} {t('stl_total') || 'items'}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" size={16} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder') || 'Search...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-bg border border-white/10 text-sm text-white placeholder:text-ink-3 focus:outline-none focus:border-accent/50"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2.5 rounded-[10px] bg-bg border border-white/10 text-sm text-white focus:outline-none focus:border-accent/50"
          aria-label={t('stl_type') || 'Part type'}
        >
          <option value="All">{t('stl_all_options') || 'All'} — {t('stl_type') || 'Type'}</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={filterFrame}
          onChange={(e) => setFilterFrame(e.target.value)}
          className="px-3 py-2.5 rounded-[10px] bg-bg border border-white/10 text-sm text-white focus:outline-none focus:border-accent/50"
          aria-label={t('stl_frame') || 'Frame'}
        >
          <option value="All">{t('stl_all_options') || 'All'} — {t('stl_frame') || 'Frame'}</option>
          {availableFrames.map((frame) => (
            <option key={frame} value={frame}>{frame}</option>
          ))}
        </select>
        <select
          value={filterAuthor}
          onChange={(e) => setFilterAuthor(e.target.value)}
          className="px-3 py-2.5 rounded-[10px] bg-bg border border-white/10 text-sm text-white focus:outline-none focus:border-accent/50 md:col-span-2 lg:col-span-1"
          aria-label={t('stl_author') || 'Author'}
        >
          <option value="All">{t('stl_all_options') || 'All'} — {t('stl_author') || 'Author'}</option>
          {availableAuthors.map((author) => (
            <option key={author} value={author}>{author}</option>
          ))}
        </select>
      </div>
      
      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
        </div>
      ) : loadError ? (
        <div className="text-center py-20 border-2 border-dashed border-rose-500/20 rounded-2xl">
          <p role="alert" className="text-sm font-bold text-rose-400 mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[10px] text-xs font-bold text-white transition-colors"
          >
            {t('action_retry')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-surface border border-white/5 rounded-2xl overflow-hidden hover:border-accent/40 transition-all group flex flex-col justify-between cursor-pointer"
              >
                {/* Image Box */}
                <div className="aspect-[4/3] bg-bg relative overflow-hidden flex items-center justify-center">
                  <Cuboid size={48} className="text-ink-3 absolute" />
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover relative z-10 transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        // Fallback on broken image link
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                  {item.material && (
                    <span className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-mono font-bold text-accent border border-accent/30">
                      {item.material}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white group-hover:text-accent transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-ink-3 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <User size={12} className="text-ink-3/70" /> {item.author}
                      </span>
                      {item.frame && (
                        <span className="text-[11px] text-accent/80 font-mono">
                          {item.frame}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-ink-3 border border-white/5">
                        {item.type}
                      </span>
                    </div>

                    {/* Georgian Description Preview */}
                    {item.description && (
                      <p className="text-xs text-ink-3 leading-relaxed line-clamp-2 pt-1 border-t border-white/5">
                        {item.description.split('\n')[0]}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-white transition-colors"
                    >
                      <Info size={14} />
                      <span>{t('stl_details') || 'Details'}</span>
                    </button>
                    
                    <button 
                      onClick={(e) => handleDownload(e, item.downloadUrl, item.title, item.id)}
                      disabled={downloadingId === item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-fill hover:bg-accent-fill-hover disabled:bg-accent-tint text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Download size={14} className={downloadingId === item.id ? "animate-bounce text-accent" : ""} />
                      {downloadingId === item.id ? t('action_downloading') : (t('stl_download') || 'Download')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-ink-3 gap-4">
              <Box size={48} className="opacity-20" />
              <p className="text-sm font-medium">{t('stl_no_results') || 'No STL files found matching your filters'}</p>
            </div>
          )}
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <Modal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.title}
          size="max-w-2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-ink-3">
                {formatShortDate(selectedItem.createdAt) || selectedItem.date}
              </span>
              <button
                type="button"
                onClick={(e) => handleDownload(e, selectedItem.downloadUrl, selectedItem.title, selectedItem.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-bg hover:opacity-90 font-bold text-sm transition-opacity cursor-pointer"
              >
                <Download size={16} />
                <span>{t('stl_download') || 'Download STL'}</span>
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Image Preview */}
            {selectedItem.image && (
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-bg border border-white/10 flex items-center justify-center">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-accent-tint text-accent border border-accent/20 text-xs font-bold">
                {selectedItem.type}
              </span>
              {selectedItem.frame && (
                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-white border border-white/10 text-xs font-bold">
                  {t('stl_compatible_frame') || 'Frame'}: {selectedItem.frame}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-lg bg-white/5 text-ink-2 border border-white/10 text-xs">
                {t('stl_author') || 'Author'}: <strong className="text-white">{selectedItem.author}</strong>
              </span>
            </div>

            {/* Full Georgian Description */}
            {selectedItem.description && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-ink-3 uppercase tracking-wider">
                  {t('stl_desc') || 'Description'}
                </h4>
                <div className="bg-bg/60 border border-white/5 rounded-xl p-4 text-sm text-ink-2 leading-relaxed whitespace-pre-line">
                  {selectedItem.description}
                </div>
              </div>
            )}

            {/* 3D Print Specs Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-accent" />
                {t('stl_specs') || '3D Print Specifications'}
              </h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedItem.material && (
                  <div className="bg-bg/50 border border-white/5 rounded-xl p-3">
                    <span className="text-[11px] text-ink-3 block font-semibold">{t('stl_material') || 'Material'}</span>
                    <span className="text-sm font-bold text-accent font-mono">{selectedItem.material}</span>
                  </div>
                )}
                {selectedItem.infill && (
                  <div className="bg-bg/50 border border-white/5 rounded-xl p-3">
                    <span className="text-[11px] text-ink-3 block font-semibold">{t('stl_infill') || 'Infill'}</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedItem.infill}</span>
                  </div>
                )}
                {selectedItem.walls !== undefined && (
                  <div className="bg-bg/50 border border-white/5 rounded-xl p-3">
                    <span className="text-[11px] text-ink-3 block font-semibold">{t('stl_walls') || 'Walls'}</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedItem.walls}</span>
                  </div>
                )}
                {selectedItem.supports && (
                  <div className="bg-bg/50 border border-white/5 rounded-xl p-3">
                    <span className="text-[11px] text-ink-3 block font-semibold">{t('stl_supports') || 'Supports'}</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedItem.supports}</span>
                  </div>
                )}
                {selectedItem.vtxMount && (
                  <div className="bg-bg/50 border border-white/5 rounded-xl p-3 col-span-2">
                    <span className="text-[11px] text-ink-3 block font-semibold">{t('stl_vtx_mount') || 'Mount'}</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedItem.vtxMount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default STLCatalog;