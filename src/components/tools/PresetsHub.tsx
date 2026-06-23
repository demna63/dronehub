import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { Preset } from '../../types';
import { Search, Copy, Check, Tag, Loader2, Terminal } from 'lucide-react';

const PresetsHub = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ფილტრაციის სთეითი
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // მონაცემების წამოღება ბაზიდან
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiService.getPresets();
        setPresets(data as Preset[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // უნიკალური ტეგების გენერირება ბაზიდან
  const allTags = ['All', ...Array.from(new Set(presets.flatMap(p => p.tags || [])))];

  // ფილტრაციის ლოგიკა
  const filteredPresets = presets.filter(preset => {
    const matchesSearch = 
      preset.title.toLowerCase().includes(search.toLowerCase()) || 
      preset.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesTag = activeTag === 'All' || (preset.tags && preset.tags.includes(activeTag));
    
    return matchesSearch && matchesTag;
  });

  // კოპირების ფუნქცია
  const handleCopy = (id: string, command?: string) => {
    if (!command) return;
    navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="მოძებნე პრესეტი..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-indigo-500 outline-none transition-colors"
          />
        </div>

        {/* Tags Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                activeTag === tag 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' 
                  : 'bg-slate-950 text-slate-400 border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid gap-4">
        {filteredPresets.length > 0 ? (
          filteredPresets.map(preset => (
            <div key={preset.id} className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Terminal size={18} className="text-indigo-400" />
                    {preset.title}
                  </h3>
                  
                  {/* Tags List */}
                  {preset.tags && preset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {preset.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md flex items-center gap-1 border border-indigo-500/20">
                          <Tag size={10} /> {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Copy Button */}
                {preset.command && (
                  <button
                    onClick={() => handleCopy(preset.id, preset.command)}
                    className={`p-2.5 rounded-xl transition-all border ${
                      copiedId === preset.id 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                    }`}
                    title="Copy Command"
                  >
                    {copiedId === preset.id ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                )}
              </div>

              <p className="text-slate-400 text-sm mb-4 leading-relaxed border-l-2 border-white/5 pl-3">
                {preset.description}
              </p>

              {/* Code Snippet Box */}
              {preset.command && (
                <div className="relative group/code">
                  <div className="absolute top-0 right-0 px-2 py-1 bg-indigo-600 text-[10px] font-bold text-white rounded-bl-lg rounded-tr-lg opacity-0 group-hover/code:opacity-100 transition-opacity pointer-events-none">
                    CLI
                  </div>
                  <div className="bg-black/50 border border-white/5 rounded-xl p-4 font-mono text-xs text-indigo-300 overflow-x-auto whitespace-pre custom-scrollbar">
                    {preset.command}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>By {preset.authorName}</span>
                <span>•</span>
                <span>{preset.software}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-slate-900/30">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search size={32} />
            </div>
            <h3 className="text-white font-bold">პრესეტები არ მოიძებნა</h3>
            <p className="text-slate-400 text-sm mt-1">სცადეთ შეცვალოთ ფილტრები</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresetsHub;