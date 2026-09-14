import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- CONTEXTS ---

// --- FIREBASE & SERVICES ---
import { apiService } from './services/apiService';
import { Category, Post, VlogEntry } from './types';
import { CATEGORIES as INITIAL_CATEGORIES } from './constants/categories';

// --- CORE COMPONENTS ---
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
// Lazy: AuthModal is the only eagerly-imported framer-motion consumer, and it
// was dragging the whole 36 KB-gzipped animation library into the first load
// for a dialog most visitors never open.
const AuthModal = React.lazy(() => import('./components/AuthModal'));

/** A blank fallback made the login button look dead while the chunk loaded. */
const AuthModalFallback: React.FC = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);
import OfflineStatus from './components/OfflineStatus';
import ErrorBoundary from './components/ErrorBoundary';
import AppRoutes from './routes/AppRoutes';
import type { FeedProps } from './components/Feed';
import { useAppData } from './hooks/useAppData';
import { APP_SCROLL_ID } from './utils/appScroll';
import { useLanguage } from './contexts/useLanguage';

const App: React.FC = () => {
  const { t } = useLanguage();
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
    setNotifications,
    vlogs,
    setVlogs,
    meetRooms,
    loading,
    postsLoading,
    postsError,
    isOffline,
    fetchPosts,
    fetchVlogs,
    fetchMeetRooms,
    postSort,
    setPostSort,
    setPostFacet,
    loadMorePosts,
    hasMorePosts,
    isLoadingMorePosts,
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

    // Optimistic update — show comment immediately. The id is provisional; it is
    // swapped for the real document id below so the row's edit/delete controls
    // address a document that actually exists.
    const optimisticId = `pending-${Date.now()}`;
    const optimisticComment = {
      id: optimisticId,
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
      const commentId = await apiService.addComment(postId, text, currentUser, post.authorId, post.title);
      if (commentId) {
        setPosts(prev => prev.map(p => p.id === postId ? {
          ...p,
          comments: (p.comments || []).map(comment => (
            comment.id === optimisticId ? { ...comment, id: commentId } : comment
          )),
        } : p));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      // Revert on failure — and rethrow. Swallowing it meant PostCard treated
      // the resolved promise as success: the input cleared, the list refetched,
      // and the comment simply vanished with no message anywhere.
      fetchPosts();
      throw error;
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
  /**
   * `markNotificationAsRead` existed end to end and the rule permitted it, but
   * nothing ever called it — so the unread badge only ever grew and clicking a
   * notification did nothing, not even navigate.
   *
   * The read flag is set optimistically: the realtime listener will confirm it,
   * and a failed write is not worth blocking navigation for.
   */
  const handleNotificationClick = (postId: string, notificationId: string) => {
    setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
    apiService.markNotificationAsRead(notificationId)
      .catch(error => console.error('Failed to mark notification read:', error));
    if (postId) navigate(`/post/${postId}`);
  };

  const handleMarkAllNotificationsRead = () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    Promise.all(unread.map(n => apiService.markNotificationAsRead(n.id)))
      .catch(error => console.error('Failed to mark notifications read:', error));
  };

  const handleEditPost = (updatedPost: Post) => {
    // usePostEdit writes to Firestore and then calls back; without this the card
    // kept rendering the pre-edit content and the save looked like it failed.
    setPosts(prev => prev.map(p => (p.id === updatedPost.id ? updatedPost : p)));
  };

  /**
   * Annotated deliberately.
   *
   * This object used to be untyped, and it carried `onLoginRequest` while
   * `FeedProps` declares `onLoginClick`. An un-annotated object literal assigned
   * to a const gets no excess-property check, so `tsc` stayed silent and every
   * login prompt in the feed — the rating bar, the comment box, the whole
   * single-post page — resolved to `undefined` and did nothing at all.
   */
  const feedProps: FeedProps = {
    user: currentUser,
    posts,
    isFetching: postsLoading,
    error: postsError,
    onRetry: () => { void fetchPosts(); },
    onLoginClick: handleLoginRequest,
    onDeletePost: handleDeletePost,
    onEditPost: handleEditPost,
    onAddComment: handleAddComment,
    onToggleSave: handleToggleSave,
    savedPostIds: currentUser?.savedPosts || [],
    postSort,
    onChangeSort: setPostSort,
    onFacetChange: setPostFacet,
    onLoadMore: () => { void loadMorePosts(); },
    hasMore: hasMorePosts,
    isLoadingMore: isLoadingMorePosts,
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
    // Handed to the routes that need them, so a visitor who never opens /vlogs
    // or /meet does not pay for those collection scans on every cold load.
    fetchVlogs,
    fetchMeetRooms,
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
    <>
        {/*
          From `md` up this is a fixed-height shell: the navbar and both
          sidebars hold their position and only the centre column scrolls.
          Below `md` the sidebars are hidden and the document scrolls as
          normal — pinning the height on a phone stops the browser's address
          bar from collapsing, which costs more screen than it saves.
        */}
        <div className="min-h-screen md:h-dvh md:overflow-hidden bg-slate-950 text-slate-200 font-sans selection:bg-sky-500/30 selection:text-sky-200">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-sky-500 focus:text-white focus:font-bold focus:text-sm focus:shadow-lg"
          >
            {t('skip_to_content')}
          </a>

          <OfflineStatus isOffline={isOffline} hasCachedData={Boolean(posts.length || vlogs.length || meetRooms.length)} />
 
          <Navbar
            currentUser={currentUser}
            onLoginClick={handleLoginRequest}
            onAddPost={handleCreatePost}
            onCreateMarketItem={handleCreateMarketItem}
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
          />

          <div className="pt-20 px-4 md:px-8 max-w-[1600px] mx-auto flex gap-8 md:h-full md:min-h-0">

            {/* Left Sidebar — scrolls its own overflow, never the page */}
            <aside aria-label={t('landmark_navigation')} className="hidden md:block w-64 flex-shrink-0 md:h-full md:min-h-0 overflow-y-auto custom-scrollbar pb-4">
              <Sidebar currentUser={currentUser} onOpenAuth={handleLoginRequest} />
            </aside>

            {/* Main Content — the app's scroll container from `md` up.
                `min-h-0` is what lets a flex child actually scroll: without it
                the item's min-height is its content, so it grows instead. */}
            <main id={APP_SCROLL_ID} className="flex-1 min-w-0 pb-20 md:h-full md:min-h-0 md:overflow-y-auto custom-scrollbar">
              <AppRoutes {...appRoutesProps} />
            </main>

            {/* Right Sidebar */}
            <aside aria-label={t('landmark_complementary')} className="hidden xl:block w-72 flex-shrink-0 md:h-full md:min-h-0 overflow-y-auto custom-scrollbar pb-4">
              <RightSidebar
                currentUser={currentUser}
                onOpenAuth={handleLoginRequest}
                trendingCommunities={categories.slice(0, 5)}
                onCommunityClick={(id) => navigate(`/category/${id}`)}
              />
            </aside>

          </div>

          {isAuthOpen && (
            // Boundary + retry: this sits outside <AppRoutes>, so a failed chunk
            // fetch (stale tab after a deploy) would otherwise throw with no
            // boundary above it and unmount the whole app — clicking "Login"
            // would white-screen the site instead of failing one dialog.
            <ErrorBoundary>
              <React.Suspense fallback={<AuthModalFallback />}>
                <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
              </React.Suspense>
            </ErrorBoundary>
          )}

        </div>
    </>
  );
};

export default App;