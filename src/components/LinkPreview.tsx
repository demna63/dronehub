
import React from 'react';
import { getFaviconUrl, getDomainName } from '../utils/linkUtils';

interface LinkPreviewProps {
  url: string;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ url }) => {
  const domain = getDomainName(url);
  const favicon = getFaviconUrl(url);

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="mt-4 flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-sky-500/30 hover:bg-sky-500/[0.02] transition-all group animate-in fade-in slide-in-from-top-2 duration-500"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden">
        {favicon ? (
          <img src={favicon} alt={domain} className="w-6 h-6 object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
        ) : (
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-0.5">გარე ბმული</div>
        <div className="text-sm font-bold text-slate-100 truncate group-hover:text-sky-400 transition-colors">
          {domain}
        </div>
        <div className="text-[10px] text-slate-400 truncate font-medium">
          {url}
        </div>
      </div>
      <div className="text-slate-700 group-hover:text-sky-500 transition-colors pr-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  );
};

export default LinkPreview;
