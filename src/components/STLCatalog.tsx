import React, { useState, useMemo, useEffect } from 'react';
import { Box, Download, Search, User, Layers, Cuboid, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
// ⚠️ ამოვიღეთ STL_ITEMS_DATA, მაგრამ დავტოვეთ კატეგორიები ფილტრებისთვის:
import { STL_TYPES, STL_FRAMES, STL_AUTHORS } from '../constants/toolsData';
import { apiService } from '../services/apiService';

const STLCatalog: React.FC = () => {
  const { t } = useLanguage();

  // --- STATE ---
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filterType, setFilterType] = useState('All');
  const [filterFrame, setFilterFrame] = useState('All');
  const [filterAuthor, setFilterAuthor] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // --- FETCH DATA FROM FIREBASE ---
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      const data = await apiService.getSTLFiles();
      setItems(data);
      setIsLoading(false);
    };
    fetchItems();
  }, []);

  // --- FILTERING ---
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchType = filterType === 'All' || item.type === filterType;
      const matchFrame = filterFrame === 'All' || item.frame === filterFrame;
      const matchAuthor = filterAuthor === 'All' || item.author === filterAuthor;
      const matchSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchType && matchFrame && matchAuthor && matchSearch;
    });
  }, [items, filterType, filterFrame, filterAuthor, searchQuery]);

  // --- DOWNLOAD FUNCTION ---
  const handleDownload = async (e: React.MouseEvent, url: string, filename: string, itemId: string) => {
    e.preventDefault();
    setDownloadingId(itemId);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${filename.replace(/\s+/g, '_')}.stl`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed, opening in new tab instead", error);
      window.open(url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
            <Box size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              {t('stl_title') || '3D Print Catalog'}
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              {t('stl_desc') || 'STL files for drone parts'}
            </p>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {filteredItems.length} / {items.length} {t('stl_total') || 'items'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder') || 'Search...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-500/50"
          aria-label={t('stl_type') || 'Part type'}
        >
          <option value="All">{t('stl_all_options') || 'All'} — {t('stl_type') || 'Type'}</option>
          {STL_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={filterFrame}
          onChange={(e) => setFilterFrame(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-500/50"
          aria-label={t('stl_frame') || 'Frame'}
        >
          <option value="All">{t('stl_all_options') || 'All'} — {t('stl_frame') || 'Frame'}</option>
          {STL_FRAMES.map((frame) => (
            <option key={frame} value={frame}>{frame}</option>
          ))}
        </select>
        <select
          value={filterAuthor}
          onChange={(e) => setFilterAuthor(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-500/50 md:col-span-2 lg:col-span-1"
          aria-label={t('stl_author') || 'Author'}
        >
          <option value="All">{t('stl_all_options') || 'All'} — {t('stl_author') || 'Author'}</option>
          {STL_AUTHORS.map((author) => (
            <option key={author} value={author}>{author}</option>
          ))}
        </select>
      </div>
      
      {/* --- CONTENT --- */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item.id} className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all group">
                {/* Image Box */}
                <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden flex items-center justify-center">
                   <Cuboid size={48} className="text-slate-800 absolute" />
                   {item.image && (
                     <img src={item.image} alt={item.title} className="w-full h-full object-cover relative z-10 group-hover:scale-105 transition-transform duration-500" />
                   )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <User size={12} /> {item.author}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/5">
                      {item.type}
                    </span>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-center">
                     <span className="text-[10px] text-slate-400">
                       {/* თუ თარიღი Firebase timestamp-ია, ვწერთ ასე: */}
                       {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : item.date}
                     </span>
                     
                     <button 
                       onClick={(e) => handleDownload(e, item.downloadUrl, item.title, item.id)}
                       disabled={downloadingId === item.id}
                       className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-xs font-bold transition-colors cursor-pointer"
                     >
                       <Download size={14} className={downloadingId === item.id ? "animate-bounce" : ""} />
                       {downloadingId === item.id ? 'იწერება...' : (t('stl_download') || 'Download')}
                     </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <Box size={48} className="opacity-20" />
              <p className="text-sm font-medium">{t('stl_no_results') || 'No STL files found matching your filters'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default STLCatalog;