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

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
  currentUser: User;
}

// მთავარი ტიპები
const POST_TYPES = [
  { id: 'news', label: 'სიახლე / ზოგადი', icon: Newspaper, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'fpv', label: 'FPV პილოტი', icon: Gamepad2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'cine', label: 'Cine Drone', icon: Camera, color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

// FPV ქვეკატეგორიები
const FPV_SUBCATEGORIES = [
  { id: 'freestyle', label: 'Freestyle', icon: Zap },
  { id: 'racing', label: 'Racing', icon: Flag },
  { id: 'longrange', label: 'Long Range', icon: Mountain },
];

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated, currentUser }) => {
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
      showToast('გთხოვთ აირჩიოთ FPV კატეგორია (Freestyle, Racing ან Long Range)', 'error');
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
      showToast('პოსტი ვერ შეიქმნა. სცადეთ თავიდან.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="ახალი პოსტი"
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
                    : 'bg-slate-950 border-white/5 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <type.icon size={24} />
                <span className="text-xs font-bold uppercase">{type.label}</span>
              </button>
            ))}
          </div>

          {/* 2. FPV ქვეკატეგორიები */}
          {mainType === 'fpv' && (
            <div className="mb-6 animate-in slide-in-from-top-2">
              <span id="fpv-subcategory-label" className="text-xs font-bold text-slate-400 uppercase mb-3 block">
                აირჩიე დისციპლინა:
              </span>
              <div role="group" aria-labelledby="fpv-subcategory-label" className="flex flex-wrap gap-2">
                {FPV_SUBCATEGORIES.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSubCategory(sub.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                      subCategory === sub.id
                        ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20'
                        : 'bg-slate-950 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
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
              <label htmlFor="post-title" className="text-xs font-bold text-slate-400 uppercase">სათაური</label>
              <input
                id="post-title"
                type="text"
                value={title}
                maxLength={POST_TITLE_MAX_LENGTH}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="მაგ: ჩემი ახალი 5-ინჩიანი ბილდი..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400"
                required
              />
            </div>

            {/* ტექსტი */}
            <div className="space-y-2">
              <label htmlFor="post-content" className="text-xs font-bold text-slate-400 uppercase">აღწერა</label>
              <textarea
                id="post-content"
                value={content}
                maxLength={POST_CONTENT_MAX_LENGTH}
                onChange={(e) => setContent(e.target.value)}
                placeholder="რაზეა ეს პოსტი? გაგვიზიარე დეტალები..."
                className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 resize-none"
                required
              />
            </div>

            {/* სურათის ატვირთვა */}
            <div className="space-y-2">
              <label htmlFor="image-upload" className="text-xs font-bold text-slate-400 uppercase">მედია (სურათი)</label>
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
                      ? 'border-indigo-500/50 bg-slate-950' 
                      : 'border-white/10 bg-slate-950/50 hover:bg-slate-950 hover:border-indigo-500/30'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative w-full h-full p-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-contain rounded-xl"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                        <span className="text-white text-sm font-bold flex items-center gap-2">
                          <ImageIcon size={16} /> შეცვლა
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <div className="p-3 bg-slate-900 rounded-full mb-2 group-hover:scale-110 transition-transform">
                        <Upload size={20} />
                      </div>
                      <span className="text-sm font-bold text-slate-400">ატვირთე სურათი</span>
                      <span className="text-xs text-slate-400 mt-1">PNG, JPG, GIF up to 5MB</span>
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
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    ქვეყნდება...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    გამოქვეყნება
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