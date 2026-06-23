import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';
import { X, Upload, Loader2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdate: (updatedUser: User) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  isOpen, onClose, currentUser, onUpdate 
}) => {
  // საწყისი სთეითი
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [gear, setGear] = useState(currentUser.gear?.join(', ') || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // სთეითის სინქრონიზაცია, როცა ახალი currentUser მოვა ან მოდალი გაიხსნება
  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setBio(currentUser.bio || '');
      setLocation(currentUser.location || '');
      setGear(currentUser.gear?.join(', ') || '');
      setAvatar(currentUser.avatar || '');
    }
  }, [isOpen, currentUser]);

  // ავატარის ატვირთვა
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("ფაილი ძალიან დიდია (მაქს. 5MB)");
      return;
    }

    setIsUploading(true);
    try {
      const url = await apiService.uploadImage(file, 'avatars');
      setAvatar(url);
    } catch (error) {
      console.error(error);
      alert("სურათის ატვირთვა ვერ მოხერხდა");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const gearArray = gear.split(',').map(g => g.trim()).filter(g => g !== "");
      
      const updatePayload = {
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        gear: gearArray,
        avatar: avatar
      };

      // 1. განახლება ბაზაში (ვიყენებთ სწორ პარამეტრებს)
      await apiService.updateUserProfile(currentUser.id, updatePayload);
      
      // 2. ლოკალურად განახლება მშობელ კომპონენტში
      onUpdate({
        ...currentUser,
        ...updatePayload
      });
      
      onClose();
    } catch (error) {
      console.error(error);
      alert("პროფილის განახლება ვერ მოხერხდა");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        
        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              პროფილის რედაქტირება
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative group cursor-pointer" 
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-white/20 group-hover:border-indigo-500 transition-colors bg-slate-800">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Camera size={32} />
                    </div>
                  )}
                </div>
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? <Loader2 className="animate-spin text-white" /> : <Upload className="text-white" size={24} />}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                დააჭირეთ ფოტოს შესაცვლელად
              </span>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">სახელი</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors"
                  placeholder="თქვენი სახელი"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">ბიოგრაფია</label>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none resize-none h-24 text-sm transition-colors"
                  placeholder="მოკლედ თქვენს შესახებ..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">ლოკაცია</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none text-sm transition-colors"
                  placeholder="მაგ: Tbilisi, Georgia"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">აღჭურვილობა (Gear)</label>
                <input 
                  type="text" 
                  value={gear} 
                  onChange={(e) => setGear(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none text-sm transition-colors"
                  placeholder="მაგ: DJI Mini 3, GoPro 11 (მძიმით გამოყავით)"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex gap-4">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-4 bg-white/5 text-slate-400 hover:text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest transition-colors"
              >
                გაუქმება
              </button>
              <button 
                type="submit" 
                disabled={isSaving || isUploading}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    ინახება...
                  </>
                ) : (
                  'შენახვა'
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditProfileModal;