import React, { useState } from 'react';
import { Youtube, Loader2, Link as LinkIcon } from 'lucide-react';
import { useToast } from '../contexts/useToast';
import Modal from './Modal';
import { useLanguage } from '../contexts/useLanguage';

interface AddVlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string, title: string) => Promise<void>;
}

const AddVlogModal: React.FC<AddVlogModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
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
      console.error('Error adding vlog:', error);
      showToast(t('vlog_add_failed'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('vlog_add_title')}
      size="max-w-md"
      busy={isSubmitting}
    >
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Youtube className="text-red-500" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-widest">YouTube</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="vlog-url" className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('vlog_youtube_link')}</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  id="vlog-url"
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
              <label htmlFor="vlog-title" className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('field_title')}</label>
              <input 
                id="vlog-title"
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('vlog_title_placeholder')}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none font-bold"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl uppercase tracking-wider shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : t('action_add')}
            </button>
          </form>
    </Modal>
  );
};

export default AddVlogModal;