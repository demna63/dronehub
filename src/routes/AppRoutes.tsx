import React, { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { scrollAppToTop } from '../utils/appScroll';
import type { MeetRoomData, Notification as NotificationType, Post, User, VlogEntry } from '../types';
import ErrorBoundary from '../components/ErrorBoundary';
import PageMeta from '../components/PageMeta';
import type { FeedProps } from '../components/Feed';

/**
 * `React.lazy` with one recovery attempt.
 *
 * A chunk that 404s after a deploy means the client is holding a stale index;
 * one reload fixes it. The `sessionStorage` flag bounds that to a single retry
 * so a genuinely missing chunk surfaces as an error instead of a reload loop.
 *
 * The `any` in the constraint is React's, not ours: `React.lazy` is declared as
 * `lazy<T extends ComponentType<any>>`, and a narrower constraint here (`never`,
 * `unknown`, a props record) no longer satisfies it — class components put their
 * props type in invariant positions such as `getDerivedStateFromProps`. The
 * inferred `T` at each call site is still the component's exact type, so props
 * remain fully checked where these components are used.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors React.lazy's own constraint
const lazyWithRetry = <T extends React.ComponentType<any>>(importer: () => Promise<{ default: T }>) => {
  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      if (typeof window !== 'undefined') {
        const reloaded = window.sessionStorage.getItem('route-reload-attempted');
        if (!reloaded) {
          window.sessionStorage.setItem('route-reload-attempted', '1');
          window.location.reload();
        }
      }
      throw error;
    }
  });
};

const Feed = lazyWithRetry(() => import('../components/Feed'));
const PostPage = lazyWithRetry(() => import('../components/PostPage'));
const ProfilePage = lazyWithRetry(() => import('../components/ProfilePage'));
const RegulationsWiki = lazyWithRetry(() => import('../components/RegulationsWiki'));
const MarketplaceList = lazyWithRetry(() => import('../components/MarketplaceList'));
const GlobalChat = lazyWithRetry(() => import('../components/GlobalChat'));
const ToolsHub = lazyWithRetry(() => import('../components/ToolsHub'));
const AdminDashboard = lazyWithRetry(() => import('../components/AdminDashboard'));
const SavedPosts = lazyWithRetry(() => import('../components/SavedPosts'));
const SearchPage = lazyWithRetry(() => import('../components/SearchPage'));
const SpotMap = lazyWithRetry(() => import('../components/SpotMap'));
const VlogSection = lazyWithRetry(() => import('../components/VlogSection'));
const MeetSection = lazyWithRetry(() => import('../components/MeetSection'));
const MeetRoom = lazyWithRetry(() => import('../components/MeetRoom'));
const NotFound = lazyWithRetry(() => import('../components/NotFound'));

const CreatePostModal = lazyWithRetry(() => import('../components/CreatePostModal'));
const CreateMarketItemModal = lazyWithRetry(() => import('../components/CreateMarketItemModal'));

interface AppRoutesProps {
  currentUser: User | null;
  posts: Post[];
  categories: Array<{ id: string; name: string; icon: string; description: string }>;
  notifications: NotificationType[];
  vlogs: VlogEntry[];
  meetRooms: MeetRoomData[];
  /** Firebase Auth has not settled yet: `currentUser` is not final. */
  authPending: boolean;
  feedProps: FeedProps;
  onLoginRequest: () => void;
  onOpenCreatePost: () => void;
  onOpenMarketModal: () => void;
  onCreatePostModalClose: () => void;
  onMarketModalClose: () => void;
  onCreatePostSuccess: () => void;
  onMarketItemSuccess: () => void;
  isCreateOpen: boolean;
  isMarketModalOpen: boolean;
  fetchVlogs: () => void;
  fetchMeetRooms: () => void;
  onAddVlog: (vlog: VlogEntry) => Promise<void>;
  onUpdateVlog: (id: string, data: Partial<VlogEntry>) => void;
  onDeleteVlog: (id: string) => void;
}

/** Blank on purpose: a text flash on every lazy route reads as jank. */
const RouteFallback: React.FC = () => <div aria-busy="true" className="min-h-[50vh]" />;

const MeetRoomPage: React.FC<{ rooms: MeetRoomData[]; user: User | null; onLoginRequest: () => void }> = ({ rooms, user, onLoginRequest }) => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const room = rooms.find((candidate) => candidate.id === roomId);
  if (!room) return <Navigate to="/meet" replace />;
  return <MeetRoom room={room} user={user} onLeave={() => navigate('/meet')} onLoginRequest={onLoginRequest} />;
};

/**
 * Runs a fetch when its route mounts.
 *
 * The vlog and meet collections used to be read on every app boot, whether or
 * not the visitor ever opened those routes. Both routes are lazy, so pairing
 * the fetch with the route is where it belonged.
 */
const OnRouteMount: React.FC<{ run: () => void; children: React.ReactNode }> = ({ run, children }) => {
  React.useEffect(() => { run(); }, [run]);
  return <>{children}</>;
};

const CategoryRedirect: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  return <Navigate to={`/category/${categoryId}`} replace />;
};

const ExternalRedirect: React.FC<{ to: string }> = ({ to }) => {
  React.useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return <RouteFallback />;
};

const AppRoutes: React.FC<AppRoutesProps> = ({
  currentUser,
  posts,
  categories: _categories,
  notifications: _notifications,
  vlogs,
  meetRooms,
  authPending,
  feedProps,
  onLoginRequest,
  onOpenCreatePost: _onOpenCreatePost,
  onOpenMarketModal,
  onCreatePostModalClose,
  onMarketModalClose,
  onCreatePostSuccess,
  onMarketItemSuccess,
  isCreateOpen,
  isMarketModalOpen,
  fetchVlogs,
  fetchMeetRooms,
  onAddVlog,
  onUpdateVlog,
  onDeleteVlog,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Start each route at the top.
   *
   * The browser does this for a document scroll, but the centre column is its
   * own scroller from `md` up and keeps its offset across a route change —
   * opening a post from halfway down the feed would drop you halfway down the
   * post.
   */
  useEffect(() => { scrollAppToTop(); }, [location.pathname]);

  return (
    <ErrorBoundary>
      <PageMeta />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Feed {...feedProps} />} />
          <Route path="/category/:categoryId" element={<Feed {...feedProps} />} />
          <Route path="/c/:categoryId" element={<CategoryRedirect />} />
          <Route path="/post/:postId" element={<PostPage posts={posts} currentUser={currentUser} feedProps={feedProps} />} />
          <Route path="/marketplace" element={<Navigate to="/market" replace />} />
          <Route path="/saved" element={authPending ? <RouteFallback /> : <SavedPosts currentUser={currentUser} onToggleSave={feedProps.onToggleSave ?? (() => {})} onLoginClick={onLoginRequest} />} />
          <Route
            path="/search"
            element={(
              <SearchPage
                currentUser={currentUser}
                onLoginClick={onLoginRequest}
                onToggleSave={feedProps.onToggleSave}
                savedPostIds={feedProps.savedPostIds}
                onAddComment={feedProps.onAddComment}
              />
            )}
          />
          <Route path="/u/:userId" element={<ProfilePage currentUser={currentUser} onToggleSave={feedProps.onToggleSave} onLoginClick={onLoginRequest} />} />
          <Route path="/regulations" element={<RegulationsWiki onBack={() => navigate('/')} currentUser={currentUser} />} />
          <Route path="/wiki" element={<RegulationsWiki onBack={() => navigate('/')} currentUser={currentUser} />} />
          <Route path="/wiki/:articleId" element={<RegulationsWiki onBack={() => navigate('/regulations')} currentUser={currentUser} />} />
          {/* Legacy tool URLs → canonical slugs or external ecosystem apps */}
          <Route path="/tools/battery" element={<Navigate to="/tools/battery-calc" replace />} />
          <Route path="/tools/channels" element={<Navigate to="/tools/channel-tuner" replace />} />
          <Route path="/tools/antenna" element={<Navigate to="/tools/antenna-tuner" replace />} />
          <Route path="/tools/pid" element={<ExternalRedirect to="https://pid-dronehub.ge" />} />
          <Route path="/tools/pid-analyzer" element={<ExternalRedirect to="https://pid-dronehub.ge" />} />
          <Route path="/tools/vtx-table" element={<ExternalRedirect to="https://vtx-dronehub.web.app" />} />
          <Route path="/tools/betaflight" element={<ExternalRedirect to="https://pid-dronehub.ge" />} />
          <Route path="/tools/betaflight-presets" element={<ExternalRedirect to="https://pid-dronehub.ge" />} />
          <Route path="/tools/rates" element={<ExternalRedirect to="https://pid-dronehub.ge" />} />
          <Route path="/tools/*" element={<ToolsHub />} />
          <Route path="/vlogs/*" element={<OnRouteMount run={fetchVlogs}><VlogSection vlogs={vlogs} currentUser={currentUser} onLoginClick={onLoginRequest} onOpenRoom={(id) => navigate(`/vlogs/${id}`)} onAddVlog={onAddVlog} onUpdateVlog={onUpdateVlog} onDeleteVlog={onDeleteVlog} /></OnRouteMount>} />
          {/* The marketplace runs its own paged query — see useMarketItems.
              It used to filter the shared feed array, which showed only the
              listings that happened to be in the currently loaded posts. */}
          <Route path="/market" element={<MarketplaceList currentUser={currentUser} onLoginRequest={onLoginRequest} onCreateListing={onOpenMarketModal} />} />
          <Route path="/market/category/:categoryId" element={<MarketplaceList currentUser={currentUser} onLoginRequest={onLoginRequest} onCreateListing={onOpenMarketModal} />} />
          <Route path="/map" element={<SpotMap currentUser={currentUser} onLoginClick={onLoginRequest} />} />
          <Route path="/chat" element={authPending ? <RouteFallback /> : currentUser ? <GlobalChat currentUser={currentUser} onUserClick={(id) => navigate(`/u/${id}`)} onLoginClick={onLoginRequest} /> : <Navigate to="/" replace />} />
          <Route path="/meet" element={<OnRouteMount run={fetchMeetRooms}><MeetSection rooms={meetRooms} user={currentUser} onOpenRoom={(id) => navigate(`/meet/${id}`)} onLoginClick={onLoginRequest} /></OnRouteMount>} />
          <Route path="/meet/:roomId" element={<OnRouteMount run={fetchMeetRooms}><MeetRoomPage rooms={meetRooms} user={currentUser} onLoginRequest={onLoginRequest} /></OnRouteMount>} />
          <Route path="/admin" element={authPending ? <RouteFallback /> : <AdminDashboard currentUser={currentUser} posts={posts} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Suspense fallback={null}>
        {isCreateOpen && currentUser && (
          <CreatePostModal onClose={onCreatePostModalClose} onPostCreated={onCreatePostSuccess} currentUser={currentUser} />
        )}
        {isMarketModalOpen && currentUser && (
          <CreateMarketItemModal onClose={onMarketModalClose} onItemCreated={onMarketItemSuccess} currentUser={currentUser} />
        )}
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
