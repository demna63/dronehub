import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- CONTEXTS ---
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';

// --- FIREBASE & SERVICES ---
import { apiService } from './services/apiService';
import { Category, VlogEntry } from './types';
import { CATEGORIES as INITIAL_CATEGORIES } from './constants';

// --- CORE COMPONENTS ---
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import AuthModal from './components/AuthModal';
import OfflineStatus from './components/OfflineStatus';
import AppRoutes from './routes/AppRoutes';
import { useAppData } from './hooks/useAppData';

const App: React.FC = () => {
  const navigate = useNavigate();
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);

  const {
    currentUser,
    setCurrentUser,
    posts,
    setPosts,
    notifications,
    vlogs,
    setVlogs,
    meetRooms,
    loading,
    isOffline,
    fetchPosts,
  } = useAppData();

  // --- Handlers ---
  const handleLoginRequest = () => setIsAuthOpen(true);

  const handleDeletePost = async (postId: string) => {
    try {
      await apiService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!currentUser) return handleLoginRequest();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update — show comment immediately
    const optimisticComment = {
      id: Date.now().toString(),
      author: currentUser.name,
      authorId: currentUser.id,
      avatar: currentUser.avatar || '',
      text,
      likes: 0,
      votes: 0,
      timestamp: new Date().toLocaleDateString('ka-GE'),
      createdAt: new Date().toISOString(),
      postId,
    };
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      comments: [...(p.comments || []), optimisticComment],
      commentsCount: (p.commentsCount || 0) + 1,
    } : p));

    try {
      await apiService.addComment(postId, text, currentUser, post.authorId, post.title);
    } catch (error) {
      console.error('Error adding comment:', error);
      // Revert on failure
      fetchPosts();
    }
  };

  const handleVote = async (postId: string, type: 'up' | 'down' | 'utility' | 'skill' | 'vision') => {
    if (!currentUser) return handleLoginRequest();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const voteValue = type === 'down' ? -1 : 1;
    const category = (type === 'up' || type === 'down') ? 'utility' : type;

    // Optimistic update — reflect vote immediately
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const telemetry = p.telemetry || { utility: 0, skill: 0, vision: 0, count: 0 };
      return {
        ...p,
        votes: (p.votes || 0) + voteValue,
        telemetry: {
          ...telemetry,
          [category]: (telemetry[category as keyof typeof telemetry] as number || 0) + voteValue,
          count: telemetry.count + 1,
        },
      };
    }));

    try {
      await apiService.ratePostTelemetry(postId, currentUser.id, category, voteValue, post.authorId, post.title, currentUser);
    } catch (error) {
      console.error('Error voting:', error);
      // Revert on failure
      fetchPosts();
    }
  };

  const handleToggleSave = async (postId: string) => {
    if (!currentUser) return handleLoginRequest();
    const saved: string[] = currentUser.savedPosts || [];
    const newSaved = saved.includes(postId)
      ? saved.filter(id => id !== postId)
      : [...saved, postId];
    try {
      await apiService.updateUserProfile(currentUser.id, { savedPosts: newSaved });
      setCurrentUser(prev => prev ? { ...prev, savedPosts: newSaved } : null);
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleCreatePost = () => currentUser ? setIsCreateOpen(true) : handleLoginRequest();
  const handleCreateMarketItem = () => currentUser ? setIsMarketModalOpen(true) : handleLoginRequest();

  // --- Feed shared props ---
  const feedProps = {
    user: currentUser,
    posts,
    fetchPosts,
    isFetching: loading,
    onLoginRequest: handleLoginRequest,
    onDeletePost: handleDeletePost,
    onAddComment: handleAddComment,
    onVote: handleVote,
    onToggleSave: handleToggleSave,
    savedPostIds: currentUser?.savedPosts || [],
  };

  const appRoutesProps = {
    currentUser,
    posts,
    categories,
    notifications,
    vlogs,
    meetRooms,
    loading,
    feedProps,
    onLoginRequest: handleLoginRequest,
    onOpenCreatePost: handleCreatePost,
    onOpenMarketModal: handleCreateMarketItem,
    onCreatePostModalClose: () => setIsCreateOpen(false),
    onMarketModalClose: () => setIsMarketModalOpen(false),
    onCreatePostSuccess: () => { setIsCreateOpen(false); fetchPosts(); },
    onMarketItemSuccess: () => { setIsMarketModalOpen(false); fetchPosts(); },
    isCreateOpen,
    isMarketModalOpen,
    onAddVlog: async (vlog: VlogEntry) => { setVlogs(prev => [vlog, ...prev]); },
    onUpdateVlog: (id: string, data: Partial<VlogEntry>) => setVlogs(prev => prev.map(v => v.id === id ? { ...v, ...data } : v)),
    onDeleteVlog: (id: string) => setVlogs(prev => prev.filter(v => v.id !== id)),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <div className="mt-4 text-sky-400 font-bold tracking-widest uppercase animate-pulse">
          Initializing System
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <ToastProvider>
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-sky-500/30 selection:text-sky-200">
          <OfflineStatus isOffline={isOffline} hasCachedData={Boolean(posts.length || vlogs.length || meetRooms.length)} />
 
          <Navbar
            currentUser={currentUser}
            onLoginClick={handleLoginRequest}
            onAddPost={handleCreatePost}
            onCreateMarketItem={handleCreateMarketItem}
            notifications={notifications}
          />

          <div className="pt-20 px-4 md:px-8 max-w-[1600px] mx-auto flex gap-8">

            {/* Left Sidebar */}
            <div className="hidden md:block w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pb-4">
              <Sidebar currentUser={currentUser} onOpenAuth={handleLoginRequest} />
            </div>

            {/* Main Content */}
            <main className="flex-1 min-w-0 pb-20">
              <AppRoutes {...appRoutesProps} />
            </main>

            {/* Right Sidebar */}
            <div className="hidden xl:block w-72 flex-shrink-0 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pb-4">
              <RightSidebar
                currentUser={currentUser}
                onOpenAuth={handleLoginRequest}
                trendingCommunities={categories.slice(0, 5)}
                onCommunityClick={(id) => navigate(`/category/${id}`)}
              />
            </div>

          </div>

          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

        </div>
      </ToastProvider>
    </LanguageProvider>
  );
};

export default App;