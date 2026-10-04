import React, { useState, useEffect } from 'react';
import { User, Post, DroneBuild } from '../types';
import { useParams, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import PostRow from './PostRow';
import { isUserAdmin } from '../utils/authUtils';
import HangarCard from './HangarCard';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfileEmptyState from './ProfileEmptyState';
import { Plus, Check, X, Save, Camera, Loader2 } from 'lucide-react';
import EditProfileModal from './EditProfileModal';
import Modal from './Modal';
import { useLanguage } from '../contexts/useLanguage';
import { profileAverageStars } from '../utils/profileRating';
import { shouldOpenProfileEditor } from '../utils/profileSettings';
import { DRONE_STATUS_KEY } from '../constants/profile';

interface ProfilePageProps {
  currentUser?: User | null;
  onToggleSave?: (id: string) => void;
  onLoginClick?: () => void;
  /** Firebase Auth has not settled. `?edit=1` waits rather than being dropped. */
  authPending?: boolean;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  currentUser, 
  onToggleSave,
  authPending = false,
}) => {
  const { t } = useLanguage();
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userBuilds, setUserBuilds] = useState<DroneBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'hangar'>('posts');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDroneId, setEditingDroneId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    frame: '',
    motors: '',
    fc_esc: '',
    vtx: '',
    camera: '',
    status: 'flying'
  });

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Deletion is confirmed inline rather than with `window.confirm`, which
  // blocks the whole page and cannot be styled or dismissed with Escape.
  const [pendingDelete, setPendingDelete] = useState<{ kind: 'drone' | 'post'; id: string } | null>(null);

  const isOwnProfile = currentUser?.id === profileUser?.id;

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      const idToFetch = userId || currentUser?.id;
      if (!idToFetch) {
        setLoading(false);
        return;
      }

      try {
        // Fetch User
        const userDocRef = doc(db, 'users', idToFetch);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setProfileUser({ id: userDocSnap.id, ...userDocSnap.data() } as User);
        } else {
          setProfileUser(null);
        }

        // Fetch Posts
        const postsQuery = query(collection(db, 'posts'), where('authorId', '==', idToFetch), orderBy('createdAt', 'desc'));
        const postsSnap = await getDocs(postsQuery);
        const fetchedPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
        setUserPosts(fetchedPosts);

        // Fetch Builds
        const buildsQuery = query(collection(db, 'droneBuilds'), where('userId', '==', idToFetch));
        const buildsSnap = await getDocs(buildsQuery);
        const fetchedBuilds = buildsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DroneBuild[];
        setUserBuilds(fetchedBuilds);

      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, currentUser?.id]);

  // The account menu links here with `?edit=1`. Open the existing editor once
  // the profile on screen is the signed-in pilot, then drop the flag so a
  // refresh does not open it again. A stale profile from the previous route
  // stays mounted until its replacement arrives — ignore that frame.
  useEffect(() => {
    if (authPending || loading) return;
    if (searchParams.get('edit') !== '1') return;
    if (profileUser && profileUser.id !== userId) return;

    if (shouldOpenProfileEditor(searchParams.get('edit'), currentUser?.id, profileUser?.id)) {
      setIsEditProfileOpen(true);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next, { replace: true });
  }, [authPending, loading, currentUser?.id, profileUser, userId, searchParams, setSearchParams]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openAddDroneModal = () => {
    setEditingDroneId(null);
    setFormData({ name: '', frame: '', motors: '', fc_esc: '', vtx: '', camera: '', status: 'flying' });
    setImageFile(null);
    setImagePreview('');
    setShowAddModal(true);
  };

  const openEditDroneModal = (drone: DroneBuild) => {
    setEditingDroneId(drone.id);
    setFormData({ 
      name: drone.name, frame: drone.frame, motors: drone.motors, 
      fc_esc: drone.fc_esc, vtx: drone.vtx, camera: drone.camera, status: drone.status 
    });
    setImageFile(null);
    setImagePreview(drone.image || '');
    setShowAddModal(true);
  };

  const handleDeleteDrone = async (droneId: string) => {
    try {
      await apiService.deleteDroneBuild(droneId);
      setUserBuilds(prev => prev.filter(b => b.id !== droneId)); 
    } catch (error) {
      console.error("Error deleting drone:", error);
    }
  };

  const handleSaveDrone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const buildData = {
        userId: currentUser.id,
        name: formData.name, frame: formData.frame, motors: formData.motors,
        fc_esc: formData.fc_esc, vtx: formData.vtx, camera: formData.camera,
        status: formData.status as 'flying' | 'broken' | 'wip',
      };

      if (editingDroneId) {
        // 🟢 რედაქტირება
        await apiService.updateDroneBuild(editingDroneId, buildData, imageFile || undefined);
      } else {
        // 🟢 დამატება
        await apiService.addDroneBuild(buildData, imageFile || null);
      }

      // ეკრანის განახლება
      const buildsQuery = query(collection(db, 'droneBuilds'), where('userId', '==', currentUser.id));
      const buildsSnap = await getDocs(buildsQuery);
      setUserBuilds(buildsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DroneBuild[]);

      setShowAddModal(false);
    } catch (error) {
      console.error("Error saving drone:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await apiService.deletePost(postId);
      setUserPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const confirmPendingDelete = async () => {
    if (!pendingDelete) return;
    const { kind, id } = pendingDelete;
    setPendingDelete(null);
    if (kind === 'drone') {
      await handleDeleteDrone(id);
    } else {
      await handleDeletePost(id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profileUser) {
    return <div className="text-center py-20 text-ink-3">{t('user_not_found')}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 duration-500">
      
      <ProfileHeader
        profileUser={profileUser}
        isOwnProfile={Boolean(isOwnProfile)}
        onEditProfile={() => setIsEditProfileOpen(true)}
        postsCount={userPosts.length}
        buildsCount={userBuilds.length}
        rating={profileAverageStars(userPosts)}
      />

      {userBuilds.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1" aria-label={t('profile_tab_hangar')}>
          {userBuilds.map((build) => {
            const statusKey = DRONE_STATUS_KEY[build.status];
            return (
              <button
                key={build.id}
                type="button"
                onClick={() => setActiveTab('hangar')}
                className="flex min-w-[240px] max-w-xs items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left transition-colors hover:bg-white/5"
              >
                {build.image ? (
                  <img src={build.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover bg-surface-2" />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
                    <Camera size={18} aria-hidden="true" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-white">{build.name}</span>
                  {build.frame && <span className="block truncate text-xs text-ink-3">{build.frame}</span>}
                  <span className="mt-1 inline-block text-[11px] font-bold text-accent">
                    {statusKey ? t(statusKey) : build.status}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {pendingDelete && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl px-4 py-3"
        >
          <p className="text-sm font-bold text-rose-200">
            {pendingDelete.kind === 'drone'
              ? t('drone_delete_question')
              : t('post_delete_question_long')}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-bold text-ink-2 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={14} aria-hidden="true" /> {t('action_cancel')}
            </button>
            <button
              type="button"
              onClick={() => void confirmPendingDelete()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 hover:text-rose-200 transition-colors"
            >
              <Check size={14} aria-hidden="true" /> {t('delete_confirm_yes')}
            </button>
          </div>
        </div>
      )}

      {/* ProfileTabs and ProfileEmptyState were imported but the markup was
          duplicated inline, so the two copies had already drifted. */}
      <ProfileTabs
        activeTab={activeTab}
        postsCount={userPosts.length}
        buildsCount={userBuilds.length}
        onTabChange={setActiveTab}
      />

      {/* CONTENT */}
      <div className="py-4">
        {activeTab === 'posts' && (
          userPosts.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {userPosts.map((post, index) => (
                <PostRow
                  key={post.id}
                  post={post}
                  isSaved={!!currentUser?.savedPosts?.includes(post.id)}
                  onToggleSave={onToggleSave}
                  canManage={Boolean(isOwnProfile) || isUserAdmin(currentUser ?? null)}
                  // PostRow asks "delete?" inline; this deletes directly.
                  onDelete={(id) => { void handleDeletePost(id); }}
                  priority={index === 0}
                />
              ))}
            </div>
          ) : (
            <ProfileEmptyState message={isOwnProfile ? t('profile_no_posts_own') : t('profile_no_posts_other')} />
          )
        )}

        {activeTab === 'hangar' && (
          <div>
            {isOwnProfile && (
              <button 
                type="button"
                onClick={openAddDroneModal}
                className="w-full mb-8 py-4 border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5 text-emerald-500 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> {t('drone_add')}
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {userBuilds.map(build => (
                <HangarCard 
                  key={build.id} 
                  build={build} 
                  isOwner={isOwnProfile}
                  onEdit={() => openEditDroneModal(build)}
                  onDelete={() => setPendingDelete({ kind: 'drone', id: build.id })}
                />
              ))}
            </div>

            {userBuilds.length === 0 && !isOwnProfile && (
              <ProfileEmptyState message={t('hangar_empty')} />
            )}
          </div>
        )}
      </div>

      {/* ADD / EDIT DRONE MODAL */}
      <Modal
        isOpen={showAddModal && Boolean(isOwnProfile)}
        onClose={() => setShowAddModal(false)}
        title={editingDroneId ? t('drone_edit') : t('drone_new')}
        size="max-w-xl"
        busy={isSubmitting}
      >
            <form onSubmit={handleSaveDrone} className="space-y-6 p-6 md:p-8">
              
              <div className="flex gap-6">
                <div className="w-32 h-32 shrink-0 bg-bg border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-emerald-500/50 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="text-ink-3 mb-2 group-hover:text-emerald-500 transition-colors" />
                      <span className="text-xs text-ink-3 font-bold">{t('field_photo')}</span>
                    </>
                  )}
                  <input id="drone-image" aria-label={t('drone_photo_upload')} type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>

                <div className="flex-1 space-y-4">
                  <input id="drone-name" aria-label="დრონის სახელი" required placeholder="Drone Name (e.g. Apex 5)" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-bg border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none" />
                  
                  <select id="drone-status" aria-label="დრონის სტატუსი" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as 'flying' | 'broken' | 'wip'})} className="w-full bg-bg border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none cursor-pointer">
                    <option value="flying">🟢 Ready to Fly</option>
                    <option value="wip">🟡 Work in Progress</option>
                    <option value="broken">🔴 Broken / Repairing</option>
                  </select>
                </div>
              </div>

              <div className="bg-bg/50 p-5 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-xs font-extrabold text-ink-3">ნაწილები (სურვილისამებრ)</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Frame" value={formData.frame} onChange={(e) => setFormData({...formData, frame: e.target.value})} className="bg-bg border border-white/10 rounded-[10px] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                    <input type="text" placeholder="Motors" value={formData.motors} onChange={(e) => setFormData({...formData, motors: e.target.value})} className="bg-bg border border-white/10 rounded-[10px] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <input type="text" placeholder="FC & ESC" value={formData.fc_esc} onChange={(e) => setFormData({...formData, fc_esc: e.target.value})} className="w-full bg-bg border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="VTX" value={formData.vtx} onChange={(e) => setFormData({...formData, vtx: e.target.value})} className="bg-bg border border-white/10 rounded-[10px] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                    <input type="text" placeholder="Camera" value={formData.camera} onChange={(e) => setFormData({...formData, camera: e.target.value})} className="bg-bg border border-white/10 rounded-[10px] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSubmitting ? 'ინახება...' : 'შენახვა'}
              </button>
            </form>
      </Modal>

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && profileUser && (
         <EditProfileModal 
           isOpen={isEditProfileOpen}
           currentUser={profileUser}
           onClose={() => setIsEditProfileOpen(false)}
           onUpdate={(updatedData) => {
             setProfileUser(prev => prev ? { ...prev, ...updatedData } : null);
           }}
         />
      )}

    </div>
  );
};

export default ProfilePage;