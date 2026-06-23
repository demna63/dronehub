import React, { useState } from 'react';
import { X, Youtube, Loader2, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddVlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string, title: string) => Promise<void>;
}

const AddVlogModal: React.FC<AddVlogModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) return;

    setIsSubmitting(true);
    try {
      await onSubmit(url, title);
      setUrl('');
      setTitle('');
      onClose();
    } catch (error) {
      alert("შეცდომა ვლოგის დამატებისას. შეამოწმეთ ლინკი.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
            <h2 className="text-lg font-black text-white uppercase tracking-tight font-mtavruli flex items-center gap-2">
              <Youtube className="text-red-500" /> ვლოგის დამატება
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">YouTube ლინკი</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="url" 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-red-500 outline-none text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">სათაური</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ვიდეოს სათაური..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none font-bold"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl uppercase tracking-wider shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'დამატება'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddVlogModal;