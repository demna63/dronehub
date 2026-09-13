import React, { useState, useEffect, useRef } from 'react';
import { User, Post } from '../types';
import { apiService } from '../services/apiService';
import { collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  FileText, Activity, Trash2, Shield, Box, Upload,
  Loader2, Users, ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isUserAdmin } from '../utils/authUtils';
import { STL_TYPES, STL_FRAMES } from '../constants/toolsData';
import { isMarketItem } from '../constants/market';
import { useToast } from '../contexts/ToastContext';

interface AdminDashboardProps {
  currentUser: User | null;
  posts: Post[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, posts: initialPosts }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'market' | 'stl' | 'users'>('overview');
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [stls, setStls] = useState<any[]>([]);

  const [isUploadingStl, setIsUploadingStl] = useState(false);
  const [stlForm, setStlForm] = useState({
    title: '',
    type: STL_TYPES[0],
    frame: STL_FRAMES[0],
    author: currentUser?.name || 'Admin',
  });
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [stlImage, setStlImage] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  /** What the admin has asked to delete, awaiting inline confirmation. */
  const [pendingDelete, setPendingDelete] = useState<{ kind: 'post' | 'stl'; id: string } | null>(null);

  const stlFileInputRef = useRef<HTMLInputElement>(null);
  const stlImageInputRef = useRef<HTMLInputElement>(null);

  // Sync posts when parent re-fetches
  useEffect(() => {
    setPosts(initialPosts || []);
  }, [initialPosts]);

  // Sync author name if currentUser loads after mount
  useEffect(() => {
    if (currentUser?.name) {
      setStlForm(prev => ({ ...prev, author: currentUser.name }));
    }
  }, [currentUser?.name]);

  // Fetch STLs only when that tab is active
  const fetchStls = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'stlFiles')));
      setStls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error fetching STLs:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'stl') fetchStls();
  }, [activeTab]);

  // --- Delete handlers ---
  //
  // Two-step instead of window.confirm: a blocking browser dialog freezes the
  // tab, cannot be dismissed with Escape, and looks nothing like the app.
  // `pendingDelete` holds what the admin has asked to remove; the row renders
  // the confirmation inline.
  const handleDeletePost = async (id: string) => {
    setPendingDelete(null);
    setDeletingId(id);
    try {
      await apiService.deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('წაშლა ვერ მოხერხდა.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteStl = async (id: string) => {
    setPendingDelete(null);
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'stlFiles', id));
      setStls(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting STL:', error);
      showToast('წაშლა ვერ მოხერხდა.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // --- STL upload ---
  const handleStlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stlFile) { showToast('აირჩიე STL ფაილი.', 'error'); return; }
    if (!stlImage) { showToast('აირჩიე სურათი.', 'error'); return; }
    setIsUploadingStl(true);
    try {
      await apiService.uploadSTLItem(stlForm, stlImage, stlFile);
      showToast('STL წარმატებით აიტვირთა.', 'success');
      setStlForm(prev => ({ ...prev, title: '' }));
      setStlFile(null);
      setStlImage(null);
      if (stlFileInputRef.current) stlFileInputRef.current.value = '';
      if (stlImageInputRef.current) stlImageInputRef.current.value = '';
      fetchStls();
    } catch (error) {
      console.error('Error uploading STL:', error);
      showToast('ატვირთვა ვერ მოხერხდა.', 'error');
    } finally {
      setIsUploadingStl(false);
    }
  };

  const DeleteControl: React.FC<{ kind: 'post' | 'stl'; id: string }> = ({ kind, id }) => {
    const isConfirming = pendingDelete?.kind === kind && pendingDelete.id === id;
    const isDeleting = deletingId === id;

    if (isConfirming) {
      return (
        <span role="alert" className="shrink-0 flex items-center gap-2">
          <span className="text-[11px] font-bold text-rose-300 hidden sm:inline">წავშალო?</span>
          <button
            type="button"
            aria-label="წაშლის დადასტურება"
            onClick={() => (kind === 'post' ? handleDeletePost(id) : handleDeleteStl(id))}
            className="px-2.5 py-1.5 rounded-lg bg-rose-500 text-white text-[11px] font-bold hover:bg-rose-400 transition-colors"
          >
            დიახ
          </button>
          <button
            type="button"
            aria-label="წაშლის გაუქმება"
            onClick={() => setPendingDelete(null)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-300 text-[11px] font-bold hover:bg-white/10 transition-colors"
          >
            არა
          </button>
        </span>
      );
    }

    return (
      <button
        type="button"
        aria-label="წაშლა"
        onClick={() => setPendingDelete({ kind, id })}
        disabled={isDeleting}
        className="shrink-0 p-2.5 text-slate-400 hover:text-white hover:bg-rose-500 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
      </button>
    );
  };

  if (!currentUser) return null;

  if (!isUserAdmin(currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-rose-500">
        <Shield size={48} className="mb-4" />
        <h1 className="text-2xl font-black uppercase">წვდომა შეზღუდულია</h1>
        <button onClick={() => navigate('/')} className="mt-4 text-slate-400 hover:text-white">
          მთავარზე დაბრუნება
        </button>
      </div>
    );
  }

  const ADMIN_TABS = [
    { id: 'overview', label: 'მთავარი',       icon: Activity    },
    { id: 'posts',    label: 'პოსტები',        icon: FileText    },
    { id: 'market',   label: 'მარკეტი',        icon: ShoppingBag },
    { id: 'stl',      label: 'STL კატალოგი',   icon: Box         },
    { id: 'users',    label: 'მომხმარებლები',  icon: Users       },
  ];

  // Classify by the stored category alone. The old `p.price ||` test treated a
  // free listing (price 0, falsy) as an ordinary post.
  const marketItems  = posts.filter(p =>  isMarketItem(p.category));
  const regularPosts = posts.filter(p => !isMarketItem(p.category));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-500">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Admin Panel</h1>
          <p className="text-sm font-bold text-slate-400">სისტემის მართვა და მონიტორინგი</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-2">
          {ADMIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all text-sm w-full text-left ${
                activeTab === tab.id
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'bg-slate-900/50 text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl p-6 min-h-[500px]">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">სტატისტიკა</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800 p-6 rounded-xl border border-white/5">
                  <p className="text-sm font-bold text-slate-400 mb-1">სულ პოსტები</p>
                  <p className="text-3xl font-black text-white">{regularPosts.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-white/5">
                  <p className="text-sm font-bold text-slate-400 mb-1">მარკეტის ნივთები</p>
                  <p className="text-3xl font-black text-white">{marketItems.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-white/5">
                  <p className="text-sm font-bold text-slate-400 mb-1">STL მოდელები</p>
                  <p className="text-3xl font-black text-white">{stls.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* POSTS */}
          {activeTab === 'posts' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">პოსტების მართვა</h2>
              <div className="space-y-3">
                {regularPosts.map(post => (
                  <div key={post.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="min-w-0 mr-4">
                      <p className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">{post.title || post.content}</p>
                      <p className="text-xs text-slate-500">ავტორი: {post.author || 'უცნობი'}</p>
                    </div>
                    <DeleteControl kind="post" id={post.id} />
                  </div>
                ))}
                {regularPosts.length === 0 && <p className="text-slate-500 text-sm">პოსტები არ მოიძებნა.</p>}
              </div>
            </div>
          )}

          {/* MARKET */}
          {activeTab === 'market' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">მარკეტის მართვა</h2>
              <div className="space-y-3">
                {marketItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4 min-w-0 mr-4">
                      {item.image && <img src={item.image} alt="item" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.title || item.content}</p>
                        <p className="text-xs font-bold text-emerald-400">{item.price} ₾</p>
                      </div>
                    </div>
                    <DeleteControl kind="post" id={item.id} />
                  </div>
                ))}
                {marketItems.length === 0 && <p className="text-slate-500 text-sm">მარკეტში ნივთები არ არის.</p>}
              </div>
            </div>
          )}

          {/* STL */}
          {activeTab === 'stl' && (
            <div>
              {/* Upload form */}
              <div className="mb-10 bg-slate-800/30 p-6 rounded-2xl border border-white/5">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Upload size={20} className="text-sky-400" /> ახალი STL მოდელის დამატება
                </h2>
                <form onSubmit={handleStlSubmit} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="stl-title" className="text-xs font-bold text-slate-400 mb-1 block">მოდელის სახელი</label>
                      <input
                        id="stl-title"
                        required type="text" placeholder="მაგ: GoPro Mount"
                        value={stlForm.title}
                        onChange={e => setStlForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="stl-author" className="text-xs font-bold text-slate-400 mb-1 block">ავტორი</label>
                      <input
                        id="stl-author"
                        required type="text"
                        value={stlForm.author}
                        onChange={e => setStlForm(prev => ({ ...prev, author: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="stl-type" className="text-xs font-bold text-slate-400 mb-1 block">ნაწილის ტიპი</label>
                      <select
                        id="stl-type"
                        value={stlForm.type}
                        onChange={e => setStlForm(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-500 outline-none transition-colors"
                      >
                        {STL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="stl-frame" className="text-xs font-bold text-slate-400 mb-1 block">თავსებადი ჩარჩო</label>
                      <select
                        id="stl-frame"
                        value={stlForm.frame}
                        onChange={e => setStlForm(prev => ({ ...prev, frame: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-500 outline-none transition-colors"
                      >
                        {STL_FRAMES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="stl-image" className="text-xs font-bold text-slate-400 mb-1 block">სურათი (PNG/JPG)</label>
                      <input
                        id="stl-image"
                        required ref={stlImageInputRef} type="file" accept="image/*"
                        onChange={e => setStlImage(e.target.files?.[0] || null)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white/5 file:text-white hover:file:bg-white/10"
                      />
                    </div>
                    <div>
                      <label htmlFor="stl-file" className="text-xs font-bold text-slate-400 mb-1 block">3D მოდელი (.STL)</label>
                      <input
                        id="stl-file"
                        required ref={stlFileInputRef} type="file" accept=".stl"
                        onChange={e => setStlFile(e.target.files?.[0] || null)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-sky-500/20 file:text-sky-400 hover:file:bg-sky-500/30"
                      />
                    </div>
                  </div>

                  <button
                    type="submit" disabled={isUploadingStl}
                    className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUploadingStl ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                    {isUploadingStl ? 'იტვირთება...' : 'STL ფაილის დამატება'}
                  </button>
                </form>
              </div>

              {/* STL list */}
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Box size={20} className="text-rose-400" /> ატვირთული მოდელები
              </h2>
              <div className="space-y-3">
                {stls.map(stl => (
                  <div key={stl.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-white">{stl.title}</p>
                      <p className="text-xs text-slate-500">{stl.type} • {stl.frame} • ავტორი: {stl.author}</p>
                    </div>
                    <DeleteControl kind="stl" id={stl.id} />
                  </div>
                ))}
                {stls.length === 0 && <p className="text-slate-500 text-sm">STL მოდელები არ არის.</p>}
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">მომხმარებლების მართვა</h2>
              <p className="text-slate-500 text-sm">მომხმარებლების სია მალე დაემატება.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
