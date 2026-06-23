import React, { useState, useEffect } from 'react';
import { Plus, Disc, Cpu, Battery, Radio, Camera, Trash2, Loader2, PenTool } from 'lucide-react';
import { apiService } from '../services/apiService';
import { User } from '../types';

interface UserGarageProps {
  userId: string;
  isOwner: boolean;
}

const UserGarage: React.FC<UserGarageProps> = ({ userId, isOwner }) => {
  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchBuilds();
  }, [userId]);

  const fetchBuilds = async () => {
    setLoading(true);
    const data = await apiService.getUserDroneBuilds(userId);
    setBuilds(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Disc className="text-sky-500 animate-spin-slow" size={24} /> ჩემი გარაჟი
        </h3>
        {isOwner && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-sky-500/20"
          >
            <Plus size={16} /> დამატება
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" /></div>
      ) : builds.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <p className="text-slate-500">გარაჟი ცარიელია</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {builds.map((build) => (
            <div key={build.id} className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden group">
              <div className="h-48 bg-slate-800 relative">
                {build.image ? (
                  <img src={build.image} className="w-full h-full object-cover" alt={build.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600"><Camera size={40}/></div>
                )}
                <div className="absolute top-4 left-4 px-3 py-1 bg-sky-500 text-white text-[10px] font-black rounded-full uppercase">
                  {build.type || 'Freestyle'}
                </div>
              </div>
              <div className="p-5">
                <h4 className="text-lg font-bold text-white mb-4">{build.name}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <SpecItem icon={Cpu} label="FC/ESC" value={build.fc} />
                  <SpecItem icon={Disc} label="Motors" value={build.motors} />
                  <SpecItem icon={Radio} label="VTX/RX" value={build.vtx} />
                  <SpecItem icon={Battery} label="Battery" value={build.battery} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SpecItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start gap-2">
    <div className="p-1.5 bg-white/5 rounded-lg text-slate-400"><Icon size={12} /></div>
    <div>
      <p className="text-[9px] text-slate-500 font-bold uppercase">{label}</p>
      <p className="text-xs text-slate-300 truncate w-24">{value || 'N/A'}</p>
    </div>
  </div>
);

export default UserGarage;