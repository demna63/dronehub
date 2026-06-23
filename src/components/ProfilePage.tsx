import React, { useState, useEffect } from 'react';
import { User, Post, DroneBuild } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import PostCard from './PostCard';
import HangarCard from './HangarCard';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfileEmptyState from './ProfileEmptyState';
import { Plus, X, Save, Camera, Loader2, Grid, Plane } from 'lucide-react';
import EditProfileModal from './EditProfileModal';

interface ProfilePageProps {
  currentUser?: User | null;
  onToggleSave?: (id: string) => void;
  onLoginClick?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  currentUser, 
  onToggleSave,
  onLoginClick
}) => {
  const { userId } = useParams();
  const navigate = useNavigate();
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
    if (!window.confirm("ნამდვილად გსურთ ამ დრონის წაშლა ანგარიდან?")) return;
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
    if (!window.confirm("ნამდვილად გსურთ პოსტის წაშლა?")) return;
    try {
      await apiService.deletePost(postId);
      setUserPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
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
    return <div className="text-center py-20 text-slate-400">მომხმარებელი არ მოიძებნა</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      <ProfileHeader
        profileUser={profileUser}
        isOwnProfile={Boolean(isOwnProfile)}
        onEditProfile={() => setIsEditProfileOpen(true)}
      />

      {/* TABS */}
      <div className="flex gap-4 border-b border-white/10 px-2">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'posts' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <Grid size={16} /> პოსტები ({userPosts.length})
        </button>
        <button 
          onClick={() => setActiveTab('hangar')}
          className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'hangar' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <Plane size={16} /> ანგარი ({userBuilds.length})
        </button>
      </div>

      {/* CONTENT */}
      <div className="py-4">
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {userPosts.length > 0 ? (
              userPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={currentUser ?? null}
                  onAddComment={async () => {}} 
                  onVote={async () => {}} 
                  onDelete={async () => await handleDeletePost(post.id)}
                  onEdit={(newContent) => {
                    setUserPosts(prev => prev.map(p => 
                      p.id === post.id ? { ...p, content: newContent } : p
                    ));
                  }}
                  isSaved={currentUser ? !!((currentUser as any).savedPosts?.includes(post.id)) : false}
                  onToggleSave={onToggleSave ? () => onToggleSave(post.id) : undefined}
                  onLoginClick={onLoginClick || (() => {})} 
                />
              ))
            ) : (
              <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest border-2 border-dashed border-white/5 rounded-3xl">
                პოსტები ჯერ არ არის
              </div>
            )}
          </div>
        )}

        {activeTab === 'hangar' && (
          <div>
            {isOwnProfile && (
              <button 
                onClick={openAddDroneModal}
                className="w-full mb-8 py-4 border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5 text-emerald-500 font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> ახალი დრონის დამატება
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {userBuilds.map(build => (
                <HangarCard 
                  key={build.id} 
                  build={build} 
                  isOwner={isOwnProfile}
                  onEdit={() => openEditDroneModal(build)}
                  onDelete={() => handleDeleteDrone(build.id)}
                />
              ))}
            </div>

            {userBuilds.length === 0 && !isOwnProfile && (
              <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest border-2 border-dashed border-white/5 rounded-3xl">
                ანგარი ცარიელია
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD / EDIT DRONE MODAL */}
      {showAddModal && isOwnProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !isSubmitting && setShowAddModal(false)}></div>
          <div className="bg-slate-900 border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-xl relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black text-white tracking-tight mb-8 flex items-center gap-3">
              <Plane className="text-emerald-500" /> {editingDroneId ? 'დრონის რედაქტირება' : 'ახალი დრონი'}
            </h2>

            <form onSubmit={handleSaveDrone} className="space-y-6">
              
              <div className="flex gap-6">
                <div className="w-32 h-32 shrink-0 bg-slate-950 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-emerald-500/50 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="text-slate-500 mb-2 group-hover:text-emerald-500 transition-colors" />
                      <span className="text-[10px] text-slate-500 font-bold uppercase">ფოტო</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>

                <div className="flex-1 space-y-4">
                  <input required placeholder="Drone Name (e.g. Apex 5)" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none" />
                  
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as 'flying' | 'broken' | 'wip'})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none cursor-pointer">
                    <option value="flying">🟢 Ready to Fly</option>
                    <option value="wip">🟡 Work in Progress</option>
                    <option value="broken">🔴 Broken / Repairing</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950/50 p-5 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ნაწილები (სურვილისამებრ)</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Frame" value={formData.frame} onChange={(e) => setFormData({...formData, frame: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                    <input type="text" placeholder="Motors" value={formData.motors} onChange={(e) => setFormData({...formData, motors: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <input type="text" placeholder="FC & ESC" value={formData.fc_esc} onChange={(e) => setFormData({...formData, fc_esc: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="VTX" value={formData.vtx} onChange={(e) => setFormData({...formData, vtx: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                    <input type="text" placeholder="Camera" value={formData.camera} onChange={(e) => setFormData({...formData, camera: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSubmitting ? 'ინახება...' : 'შენახვა'}
              </button>
            </form>
          </div>
        </div>
      )}

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