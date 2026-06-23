import React, { useState } from 'react';
import { PostRatings } from '../types';
import { Activity, Zap, Eye, Check } from 'lucide-react';

interface PostTelemetryProps {
  stats?: PostRatings;
  onRate: (u: number, s: number, v: number) => Promise<void>;
  userHasVoted: boolean;
}

const PostTelemetry: React.FC<PostTelemetryProps> = ({ stats, onRate, userHasVoted }) => {
  const [isVoting, setIsVoting] = useState(false);
  // სლაიდერების სთეითი (0-100)
  const [inputs, setInputs] = useState({ u: 50, s: 50, v: 50 });

  // პროცენტების გამოთვლა (საშუალო მაჩვენებელი)
  const count = stats?.count || 0;
  const avgU = count ? Math.round(stats!.utility / count) : 0;
  const avgS = count ? Math.round(stats!.skill / count) : 0;
  const avgV = count ? Math.round(stats!.vision / count) : 0;

  const handleSubmit = async () => {
    await onRate(inputs.u, inputs.s, inputs.v);
    setIsVoting(false);
  };

  // შენი CSS სტილები (Tailwind-ით)
  // bg-[#1a1a1a] -> შავი ფონი
  // text-[#00ff00] -> ტერმინალის მწვანე
  // font-mono -> Courier New სტილი

  return (
    <div className="w-full max-w-[320px] bg-[#1a1a1a] border-2 border-[#333] rounded-lg p-5 font-mono text-[#00ff00] shadow-lg shadow-green-900/10 mt-4">
      
      <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-2">
        <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} /> OSD Telemetry
        </h4>
        {!userHasVoted && !isVoting && (
          <button 
            onClick={() => setIsVoting(true)}
            className="text-[10px] bg-[#333] hover:bg-[#00ff00] hover:text-black px-2 py-1 rounded transition-colors"
          >
            RATE
          </button>
        )}
      </div>

      {isVoting ? (
        /* --- ხმის მიცემის რეჟიმი --- */
        <div className="space-y-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span>Utility</span> <span>{inputs.u}%</span></div>
            <input type="range" min="0" max="100" value={inputs.u} onChange={e => setInputs({...inputs, u: Number(e.target.value)})} className="w-full accent-[#00ff00] h-2 bg-[#333] rounded-lg appearance-none cursor-pointer"/>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span>Skill</span> <span>{inputs.s}%</span></div>
            <input type="range" min="0" max="100" value={inputs.s} onChange={e => setInputs({...inputs, s: Number(e.target.value)})} className="w-full accent-[#00ff00] h-2 bg-[#333] rounded-lg appearance-none cursor-pointer"/>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span>Vision</span> <span>{inputs.v}%</span></div>
            <input type="range" min="0" max="100" value={inputs.v} onChange={e => setInputs({...inputs, v: Number(e.target.value)})} className="w-full accent-[#00ff00] h-2 bg-[#333] rounded-lg appearance-none cursor-pointer"/>
          </div>
          <button onClick={handleSubmit} className="w-full mt-2 bg-[#00ff00] text-black font-bold py-1 rounded text-xs flex items-center justify-center gap-2 hover:opacity-90">
            <Check size={14} /> CONFIRM DATA
          </button>
        </div>
      ) : (
        /* --- ჩვენების რეჟიმი (შენი HTML სტრუქტურა) --- */
        <div className="space-y-3">
          
          {/* Utility Bar */}
          <div className="stat-row">
            <div className="flex justify-between text-[10px] mb-1 opacity-60">
              <span className="flex items-center gap-1"><Zap size={10}/> UTILITY</span>
              <span>{avgU}%</span>
            </div>
            <div className="h-2.5 bg-[#333] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00ff00] rounded-full shadow-[0_0_10px_#00ff00]" 
                style={{ width: `${avgU}%`, transition: 'width 1s ease-out' }}
              ></div>
            </div>
          </div>

          {/* Skill Bar */}
          <div className="stat-row">
            <div className="flex justify-between text-[10px] mb-1 opacity-60">
              <span className="flex items-center gap-1"><Activity size={10}/> SKILL</span>
              <span>{avgS}%</span>
            </div>
            <div className="h-2.5 bg-[#333] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00ff00] rounded-full shadow-[0_0_10px_#00ff00]" 
                style={{ width: `${avgS}%`, transition: 'width 1s ease-out' }}
              ></div>
            </div>
          </div>

          {/* Vision Bar */}
          <div className="stat-row">
            <div className="flex justify-between text-[10px] mb-1 opacity-60">
              <span className="flex items-center gap-1"><Eye size={10}/> VISION</span>
              <span>{avgV}%</span>
            </div>
            <div className="h-2.5 bg-[#333] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00ff00] rounded-full shadow-[0_0_10px_#00ff00]" 
                style={{ width: `${avgV}%`, transition: 'width 1s ease-out' }}
              ></div>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="mt-4 pt-2 border-t border-dashed border-[#555] flex justify-between items-center text-[10px]">
            <span>Total Votes: {count}</span>
            <span className="font-bold">XP Gained: +{Math.round((avgU + avgS + avgV)/3)}</span>
          </div>

        </div>
      )}
    </div>
  );
};

export default PostTelemetry;