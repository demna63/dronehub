import React, { useState } from 'react';
import { 
  Image as ImageIcon, Loader2, Gamepad2, 
  Camera, Zap, Flag, Mountain, Newspaper, Upload 
} from 'lucide-react';
import { useToast } from '../contexts/useToast';
import Modal from './Modal';
import { apiService } from '../services/apiService';
import { compressImageFile } from '../services/storageService';
import type { ProcessedImage } from '../services/storageService';
import { POST_CONTENT_MAX_LENGTH, POST_TITLE_MAX_LENGTH } from '../constants/limits';
import type { User } from '../types';
import { useLanguage } from '../contexts/useLanguage';

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
  currentUser: User;
}

// მთავარი ტიპები
const POST_TYPES = [
  { id: 'news', labelKey: 'post_type_news', icon: Newspaper, color: 'text-accent', bg: 'bg-accent-tint' },
  { id: 'fpv', labelKey: 'post_type_fpv', icon: Gamepad2, color: 'text-accent', bg: 'bg-accent-tint' },
  { id: 'cine', labelKey: 'post_type_cine', icon: Camera, color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

// FPV ქვეკატეგორიები
const FPV_SUBCATEGORIES = [
  { id: 'freestyle', label: 'Freestyle', icon: Zap },
  { id: 'racing', label: 'Racing', icon: Flag },
  { id: 'longrange', label: 'Long Range', icon: Mountain },
];

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated, currentUser }) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // ველები
  const [mainType, setMainType] = useState<string>('news'); // news, fpv, cine
  const [subCategory, setSubCategory] = useState<string>(''); // freestyle, racing, etc.
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const processed = await compressImageFile(file);
      setImage(processed);
      setImagePreview(URL.createObjectURL(processed.file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    // FPV-ს შემთხვევაში ქვეკატეგორია აუცილებელია
    if (mainType === 'fpv' && !subCategory) {
      showToast(t('post_pick_fpv_category'), 'error');
      return;
    }

    setLoading(true);

    try {
      // კატეგორიის განსაზღვრა ბაზისთვის
      let finalCategory = mainType;
      if (mainType === 'fpv') {
        finalCategory = subCategory; 
      }

      // The author is passed through as-is: `addPost` persists only id, name and
      // avatar. The previous literal also probed `uid`/`displayName`/`photoURL`,
      // which are Firebase auth fields and never present on the app's `User`,
      // so those branches were dead and the `as any` was hiding it.
      await apiService.addPost({
        title,
        content,
        category: finalCategory, 
        subCategory: mainType === 'fpv' ? 'fpv' : '', 
        tags: [mainType, subCategory].filter(Boolean),
        image: image || null, 
        author: currentUser,
      });

      onPostCreated();
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      showToast(t('post_create_failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('post_new_title')}
      size="max-w-2xl"
      busy={loading}
    >
        <div className="p-6">
          
          {/* 1. კატეგორიის არჩევა (ღილაკები) */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {POST_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setMainType(type.id);
                  setSubCategory(''); 
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  mainType === type.id
                    ? `${type.bg} ${type.color} border-${type.color.split('-')[1]}-500/50`
                    : 'bg-bg border-white/5 text-ink-3 hover:bg-surface-2'
                }`}
              >
                <type.icon size={24} />
                <span className="text-xs font-bold">{t(type.labelKey)}</span>
              </button>
            ))}
          </div>

          {/* 2. FPV ქვეკატეგორიები */}
          {mainType === 'fpv' && (
            <div className="mb-6">
              <span id="fpv-subcategory-label" className="text-xs font-bold text-ink-3 mb-3 block">
                {t('post_pick_discipline')}
              </span>
              <div role="group" aria-labelledby="fpv-subcategory-label" className="flex flex-wrap gap-2">
                {FPV_SUBCATEGORIES.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSubCategory(sub.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-bold border transition-all ${
                      subCategory === sub.id
                        ? 'bg-accent-fill text-white border-accent/30 shadow-lg '
                        : 'bg-bg text-ink-3 border-white/5 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <sub.icon size={16} />
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* სათაური */}
            <div className="space-y-2">
              <label htmlFor="post-title" className="text-xs font-bold text-ink-3">{t('field_title')}</label>
              <input
                id="post-title"
                type="text"
                value={title}
                maxLength={POST_TITLE_MAX_LENGTH}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('post_title_placeholder')}
                className="w-full bg-bg border border-white/10 rounded-[10px] px-4 py-3 text-white focus:outline-none focus:border-accent/50 transition-colors placeholder:text-ink-3"
                required
              />
            </div>

            {/* ტექსტი */}
            <div className="space-y-2">
              <label htmlFor="post-content" className="text-xs font-bold text-ink-3">{t('field_description')}</label>
              <textarea
                id="post-content"
                value={content}
                maxLength={POST_CONTENT_MAX_LENGTH}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('post_body_placeholder')}
                className="w-full h-32 bg-bg border border-white/10 rounded-[10px] px-4 py-3 text-white focus:outline-none focus:border-accent/50 transition-colors placeholder:text-ink-3 resize-none"
                required
              />
            </div>

            {/* სურათის ატვირთვა */}
            <div className="space-y-2">
              <label htmlFor="image-upload" className="text-xs font-bold text-ink-3">{t('field_media_image')}</label>
              <div className="relative group">
                <input
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    imagePreview 
                      ? 'border-accent/30 bg-bg' 
                      : 'border-white/10 bg-bg/50 hover:bg-bg hover:border-accent/30'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative w-full h-full p-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-contain rounded-[10px]"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-[10px]">
                        <span className="text-white text-sm font-bold flex items-center gap-2">
                          <ImageIcon size={16} /> შეცვლა
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-ink-3">
                      <div className="p-3 bg-surface rounded-full mb-2 transition-transform">
                        <Upload size={20} />
                      </div>
                      <span className="text-sm font-bold text-ink-3">ატვირთე სურათი</span>
                      <span className="text-xs text-ink-3 mt-1">PNG, JPG, GIF up to 5MB</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-accent-fill hover:bg-accent-fill-hover active:bg-accent-fill-active text-white font-bold rounded-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('action_publishing')}
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    {t('action_publish')}
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
    </Modal>
  );
};

export default CreatePostModal;