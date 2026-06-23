import React from 'react';
import { Unlock, Info, CheckCircle2, PlayCircle, Move, MousePointerClick } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const FrequencyUnlocker: React.FC = () => {
  const { t } = useLanguage();

  // ეს არის ის სკრიპტი, რომელიც თქვენ მოგვაწოდეთ, მინიმალისტურ ფორმატში
  const bookmarkletCode = `javascript:(()=>{const o=(e,t=!1)=>{const n=document.getElementById('__bf_vtx_overlay__');n&&n.remove();const i=document.createElement('div');i.id='__bf_vtx_overlay__';i.style.position='fixed';i.style.top='20px';i.style.right='20px';i.style.zIndex='999999';i.style.padding='12px 16px';i.style.borderRadius='16px';i.style.fontFamily='system-ui,sans-serif';i.style.fontSize='14px';i.style.boxShadow='0 8px 24px rgba(0,0,0,.25)';i.style.background=t?'rgba(185,28,28,0.95)':'rgba(6,95,70,0.95)';i.style.color='#fff';i.style.display='flex';i.style.alignItems='center';i.style.gap='10px';const span=document.createElement('span');span.textContent=e;i.appendChild(span);document.body.appendChild(i);setTimeout(()=>i.remove(),3500)};try{if(!location.href.includes('app.betaflight.com'))return o('Error: app.betaflight.com not detected',!0);if(!document.querySelector('li.tab_vtx.active'))return o('Error: Video Transmitter tab not active',!0);const e=[...document.querySelectorAll('input')].filter(e=>/^vtx_table_band_channel_\\d+_\\d+$/.test(e.id));if(!e.length)return o('Error: Input fields not found',!0);let t=0;e.forEach(e=>{'5999'===e.getAttribute('max')&&(e.setAttribute('max','19999'),t++)});t?o(\`Success: Unlocked \${t} frequencies\`):o('Inputs not found or already unlocked',!0)}catch(e){o('Error: '+e.message,!0)}})();`;

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
          <Unlock size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {t('unlock_title') || 'Unlock BF Frequency Limit'}
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            {t('unlock_desc') || 'Remove the maximum frequency limit for VTX tables'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Button & Action */}
        <div className="space-y-8">
          
          {/* Main Action Area */}
          <div className="bg-slate-950/50 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-6 relative overflow-hidden group text-center">
            
            <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>
            
            <h3 className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em] animate-pulse">
              {t('unlock_drag_me') || '⬇ Drag this button to bookmarks bar ⬇'}
            </h3>

            {/* The Magic Button */}
            <a 
              href={bookmarkletCode}
              className="relative z-10 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(234,88,12,0.3)] hover:shadow-[0_0_50px_rgba(234,88,12,0.5)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 text-sm uppercase tracking-widest cursor-grab active:cursor-grabbing"
              onClick={(e) => e.preventDefault()} // Prevent clicking, force dragging
              title="Drag me to bookmarks!"
            >
              <Unlock size={18} />
              {t('unlock_btn_text') || 'Unlock VTX Table'}
            </a>

            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <Move size={12} />
              <span>Drag & Drop enabled</span>
            </div>

          </div>

          {/* Warning / Info */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex gap-4">
            <Info className="text-amber-500 flex-shrink-0 mt-1" size={20} />
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-200 uppercase">Important Note</h4>
              <p className="text-xs text-amber-200/70 leading-relaxed">
                This tool only works on the <strong>Web Version</strong> of Betaflight Configurator (app.betaflight.com) or Chrome Apps. It modifies the HTML constraints temporarily to allow saving frequencies above 5999MHz.
              </p>
            </div>
          </div>

        </div>

        {/* Right: Instructions */}
        <div className="space-y-6">
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" /> Instructions
              </h3>
            </div>
            
            <div className="p-6 space-y-6 relative">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-bold text-slate-400 flex-shrink-0">1</div>
                <div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {t('unlock_instruction_1') || 'Drag the button to your browser bookmarks bar.'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-bold text-slate-400 flex-shrink-0">2</div>
                <div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {t('unlock_instruction_2') || 'Open Betaflight Configurator (Web Version).'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-bold text-slate-400 flex-shrink-0">3</div>
                <div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {t('unlock_instruction_3') || 'Go to the "Video Transmitter" tab.'}
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                <div>
                  <p className="text-sm text-white font-bold leading-relaxed">
                    {t('unlock_instruction_4') || 'Click the bookmark to unlock frequencies.'}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-fit">
                    <MousePointerClick size={12} /> Click only when tab is active
                  </div>
                </div>
              </div>

              {/* Connector Lines */}
              <div className="absolute top-10 left-[39px] bottom-12 w-[1px] bg-white/5 -z-10"></div>
            </div>
          </div>

          {/* Video Placeholder (Optional) */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-red-600 rounded-lg text-white group-hover:scale-110 transition-transform">
                 <PlayCircle size={20} fill="currentColor" className="opacity-90" />
               </div>
               <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                 {t('unlock_video_guide') || 'Watch Video Guide'}
               </span>
             </div>
             <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-1 rounded">Coming Soon</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FrequencyUnlocker;