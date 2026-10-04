import React, { useState, useRef, useEffect } from 'react';
import { User, SocialLinks } from '../types';
import { apiService } from '../services/apiService';
import { prepareAvatarFile, prepareCoverFile } from '../services/storageService';
import { AlertCircle, Loader2, Upload } from 'lucide-react';
import Avatar from './Avatar';
import Modal from './Modal';
import { useLanguage } from '../contexts/useLanguage';
import { SIDEBAR_CATEGORIES } from '../constants/navigation';
import {
  EXPERIENCE_LEVELS,
  SOCIAL_FIELDS,
  SocialFieldId,
  ExperienceLevel,
  experienceLevelKey,
  isExperienceLevel,
} from '../constants/profile';
import { normalizeSocialUrl } from '../utils/socialUrl';

/** Matches the 5MB the copy promises; the crop shrinks it far below this. */
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_COVER_BYTES = 10 * 1024 * 1024;

const FIELD =
  'w-full bg-bg border border-white/10 rounded-[10px] px-4 py-3 text-white focus:border-accent/50 outline-none text-sm transition-colors';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdate: (updatedUser: User) => void;
}

/** Keys thrown by storageService that are safe to show to the user as-is. */
const IMAGE_ERROR_KEYS = new Set([
  'image_read_failed',
  'image_canvas_failed',
  'image_process_failed',
  'upload_too_large',
  'upload_wrong_type',
]);

const emptyLinks = (): Record<SocialFieldId, string> => ({
  instagram: '',
  youtube: '',
  website: '',
  facebook: '',
  tiktok: '',
});

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen, onClose, currentUser, onUpdate,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [gear, setGear] = useState(currentUser.gear?.join(', ') || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [coverImage, setCoverImage] = useState(currentUser.coverImage || '');
  const [level, setLevel] = useState<ExperienceLevel | ''>(
    currentUser.experienceLevel && isExperienceLevel(currentUser.experienceLevel)
      ? currentUser.experienceLevel
      : '',
  );
  const [interests, setInterests] = useState<string[]>(currentUser.droneInterests ?? []);
  const [links, setLinks] = useState<Record<SocialFieldId, string>>(emptyLinks);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(currentUser.name);
    setBio(currentUser.bio || '');
    setLocation(currentUser.location || '');
    setGear(currentUser.gear?.join(', ') || '');
    setAvatar(currentUser.avatar || '');
    setCoverImage(currentUser.coverImage || '');
    setLevel(currentUser.experienceLevel && isExperienceLevel(currentUser.experienceLevel)
      ? currentUser.experienceLevel
      : '');
    setInterests(currentUser.droneInterests ?? []);
    const next = emptyLinks();
    for (const field of SOCIAL_FIELDS) {
      next[field.id] = currentUser.socialLinks?.[field.id] || '';
    }
    setLinks(next);
    setError(null);
  }, [isOpen, currentUser]);

  const uploadErrorMessage = (uploadError: unknown): string => {
    const key = uploadError instanceof Error ? uploadError.message : '';
    return t(IMAGE_ERROR_KEYS.has(key) ? key : 'upload_failed');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      setError(t('upload_too_large'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError(t('upload_wrong_type'));
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
      setError(uploadErrorMessage(uploadError));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_COVER_BYTES) {
      setError(t('upload_too_large'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError(t('upload_wrong_type'));
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const cropped = await prepareCoverFile(file);
      const { url } = await apiService.uploadImageWithMeta(cropped, 'avatars');
      setCoverImage(url);
    } catch (uploadError) {
      console.error('Cover upload failed:', uploadError);
      setError(uploadErrorMessage(uploadError));
    } finally {
      setIsUploading(false);
    }
  };

  const toggleInterest = (id: string) => {
    setInterests((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const socialLinks: SocialLinks = {};
    for (const field of SOCIAL_FIELDS) {
      const raw = links[field.id].trim();
      if (!raw) continue;
      const url = normalizeSocialUrl(raw);
      if (!url) {
        setError(t('profile_link_invalid'));
        return;
      }
      socialLinks[field.id] = url;
    }

    setIsSaving(true);
    setError(null);
    try {
      const gearArray = gear.split(',').map((item) => item.trim()).filter((item) => item !== '');
      const knownInterests = SIDEBAR_CATEGORIES
        .map((category) => category.id)
        .filter((id) => interests.includes(id));

      const updatePayload = {
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        gear: gearArray,
        avatar,
        coverImage,
        experienceLevel: level,
        droneInterests: knownInterests,
        socialLinks,
      };

      await apiService.updateUserProfile(currentUser.id, updatePayload);
      onUpdate({ ...currentUser, ...updatePayload });
      onClose();
    } catch (saveError) {
      console.error('Profile update failed:', saveError);
      setError(t('profile_update_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('profile_edit')}
      size="max-w-xl"
      busy={isSaving || isUploading}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-bold text-ink-3 ml-1">{t('field_cover')}</span>
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="relative block h-28 w-full overflow-hidden rounded-2xl border border-dashed border-white/15 bg-bg text-left"
          >
            {coverImage ? (
              <img src={coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center gap-2 text-xs font-bold text-ink-3">
                <Upload size={16} aria-hidden="true" /> {t('profile_cover_upload')}
              </span>
            )}
          </button>
          <input
            type="file"
            ref={coverInputRef}
            className="hidden"
            accept="image/*"
            aria-label={t('profile_cover_upload')}
            onChange={handleCoverUpload}
          />
          {coverImage && (
            <button
              type="button"
              onClick={() => setCoverImage('')}
              className="text-xs font-bold text-ink-3 hover:text-white"
            >
              {t('profile_cover_remove')}
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar
              src={avatar}
              name={name || currentUser.name}
              size={96}
              ringClassName="border-2 border-dashed border-white/20 group-hover:border-accent transition-colors"
            />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? <Loader2 className="animate-spin text-white" /> : <Upload className="text-white" size={24} />}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              aria-label={t('profile_avatar_hint')}
              onChange={handleImageUpload}
            />
          </div>
          <span className="text-xs font-bold text-ink-3 text-center">
            {t('profile_avatar_hint')}
            <span className="block mt-1 font-normal">{t('profile_avatar_crop')}</span>
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-profile-name" className="text-xs font-bold text-ink-3 ml-1">{t('field_name')}</label>
            <input
              id="edit-profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={FIELD}
              placeholder={t('field_your_name')}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-profile-bio" className="text-xs font-bold text-ink-3 ml-1">{t('field_bio')}</label>
            <textarea
              id="edit-profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={`${FIELD} resize-none h-24`}
              placeholder={t('field_bio_placeholder')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="edit-profile-location" className="text-xs font-bold text-ink-3 ml-1">{t('field_location')}</label>
              <input
                id="edit-profile-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={FIELD}
                placeholder={t('field_location_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-profile-level" className="text-xs font-bold text-ink-3 ml-1">{t('field_level')}</label>
              <select
                id="edit-profile-level"
                value={level}
                onChange={(e) => setLevel(isExperienceLevel(e.target.value) ? e.target.value : '')}
                className={FIELD}
              >
                <option value="">{t('profile_level_unset')}</option>
                {EXPERIENCE_LEVELS.map((item) => (
                  <option key={item} value={item}>{t(experienceLevelKey(item))}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-ink-3 ml-1">{t('field_interests')}</span>
            <div className="flex flex-wrap gap-2">
              {SIDEBAR_CATEGORIES.map((category) => {
                const selected = interests.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleInterest(category.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                      selected
                        ? 'bg-accent-tint border-accent/40 text-accent'
                        : 'bg-bg border-white/10 text-ink-2 hover:text-white'
                    }`}
                  >
                    {t(category.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-profile-gear" className="text-xs font-bold text-ink-3 ml-1">{t('field_gear')}</label>
            <input
              id="edit-profile-gear"
              type="text"
              value={gear}
              onChange={(e) => setGear(e.target.value)}
              className={FIELD}
              placeholder={t('field_gear_placeholder')}
            />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-ink-3 ml-1">{t('field_links')}</legend>
            {SOCIAL_FIELDS.map((field) => (
              <input
                key={field.id}
                type="text"
                inputMode="url"
                aria-label={t(field.labelKey)}
                value={links[field.id]}
                onChange={(e) => setLinks((current) => ({ ...current, [field.id]: e.target.value }))}
                className={FIELD}
                placeholder={t(field.labelKey)}
              />
            ))}
          </fieldset>
        </div>

        {error && (
          <p
            role="alert"
            className="flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-[10px] px-3 py-2.5"
          >
            <AlertCircle size={14} className="shrink-0" aria-hidden="true" /> {error}
          </p>
        )}

        <div className="pt-2 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-white/5 text-ink-3 hover:text-white font-bold rounded-2xl text-xs transition-colors"
          >
            {t('action_cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="flex-1 py-4 bg-accent-fill hover:bg-accent-fill-hover text-white font-bold rounded-2xl text-xs shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {t('action_saving')}
              </>
            ) : (
              t('action_save')
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProfileModal;
