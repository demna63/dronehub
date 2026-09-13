import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';
import { prepareAvatarFile } from '../services/storageService';
import { AlertCircle, Loader2, Upload } from 'lucide-react';
import Avatar from './Avatar';
import Modal from './Modal';

/** Matches the 5MB the copy promises; the crop shrinks it far below this. */
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // სთეითის სინქრონიზაცია, როცა ახალი currentUser მოვა ან მოდალი გაიხსნება
  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setBio(currentUser.bio || '');
      setLocation(currentUser.location || '');
      setGear(currentUser.gear?.join(', ') || '');
      setAvatar(currentUser.avatar || '');
      setError(null);
    }
  }, [isOpen, currentUser]);

  /**
   * Crop first, upload second.
   *
   * The previous version uploaded the picked file untouched, so a wide
   * screenshot was stored as-is and every circular avatar in the app showed a
   * `object-cover` slice of its middle. `prepareAvatarFile` centre-crops to a
   * square and re-encodes at 512px, so the stored bytes are exactly what is
   * shown here in the preview.
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so re-picking the same file after a failure still fires.
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      setError('ფაილი ძალიან დიდია (მაქს. 5MB).');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('აირჩიე სურათი (JPEG, PNG ან WebP).');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const cropped = await prepareAvatarFile(file);
      const { url } = await apiService.uploadImageWithMeta(cropped, 'avatars');
      setAvatar(url);
    } catch (uploadError) {
      console.error('Avatar upload failed:', uploadError);
      setError(
        uploadError instanceof Error && /ვერ|აირჩიე/.test(uploadError.message)
          ? uploadError.message
          : 'სურათის ატვირთვა ვერ მოხერხდა. სცადე ხელახლა.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);
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
    } catch (saveError) {
      console.error('Profile update failed:', saveError);
      setError('პროფილის განახლება ვერ მოხერხდა. სცადე ხელახლა.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="პროფილის რედაქტირება"
      busy={isSaving || isUploading}
    >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative group cursor-pointer" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar
                  src={avatar}
                  name={name || currentUser.name}
                  size={96}
                  ringClassName="border-2 border-dashed border-white/20 group-hover:border-indigo-500 transition-colors"
                />
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
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 text-center">
                დააჭირე ფოტოს შესაცვლელად
                <span className="block mt-1 normal-case tracking-normal text-slate-600">
                  კვადრატულად ჩამოიჭრება ცენტრიდან
                </span>
              </span>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="edit-profile-name" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">სახელი</label>
                <input 
                  id="edit-profile-name"
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors"
                  placeholder="თქვენი სახელი"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-profile-bio" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">ბიოგრაფია</label>
                <textarea 
                  id="edit-profile-bio"
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none resize-none h-24 text-sm transition-colors"
                  placeholder="მოკლედ თქვენს შესახებ..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-profile-location" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">ლოკაცია</label>
                <input 
                  id="edit-profile-location"
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none text-sm transition-colors"
                  placeholder="მაგ: Tbilisi, Georgia"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-profile-gear" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">აღჭურვილობა (Gear)</label>
                <input 
                  id="edit-profile-gear"
                  type="text" 
                  value={gear} 
                  onChange={(e) => setGear(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none text-sm transition-colors"
                  placeholder="მაგ: DJI Mini 3, GoPro 11 (მძიმით გამოყავით)"
                />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5"
              >
                <AlertCircle size={14} className="shrink-0" aria-hidden="true" /> {error}
              </p>
            )}

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
    </Modal>
  );
};

export default EditProfileModal;