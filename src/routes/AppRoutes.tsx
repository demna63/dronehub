import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import type { MeetRoomData, Notification as NotificationType, Post, User, VlogEntry } from '../types';
import ErrorBoundary from '../components/ErrorBoundary';
import type { FeedProps } from '../components/Feed';

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
const ProfilePage = lazyWithRetry(() => import('../components/ProfilePage'));
const RegulationsWiki = lazyWithRetry(() => import('../components/RegulationsWiki'));
const MarketplaceList = lazyWithRetry(() => import('../components/MarketplaceList'));
const GlobalChat = lazyWithRetry(() => import('../components/GlobalChat'));
const ToolsHub = lazyWithRetry(() => import('../components/ToolsHub'));
const AdminDashboard = lazyWithRetry(() => import('../components/AdminDashboard'));
const SavedPosts = lazyWithRetry(() => import('../components/SavedPosts'));
const SpotMap = lazyWithRetry(() => import('../components/SpotMap'));
const VlogSection = lazyWithRetry(() => import('../components/VlogSection'));
const MeetSection = lazyWithRetry(() => import('../components/MeetSection'));
const MeetRoom = lazyWithRetry(() => import('../components/MeetRoom'));

const CreatePostModal = lazyWithRetry(() => import('../components/CreatePostModal'));
const CreateMarketItemModal = lazyWithRetry(() => import('../components/CreateMarketItemModal'));
const PIDAnalyzer = lazyWithRetry(() => import('../components/PIDAnalyzer'));
const BetaflightPresetTool = lazyWithRetry(() => import('../components/BetaflightPresetTool'));
const AntennaTuner = lazyWithRetry(() => import('../components/AntennaTuner'));
const BatteryCalculator = lazyWithRetry(() => import('../components/BatteryCalculator'));
const ChannelTuner = lazyWithRetry(() => import('../components/ChannelTuner'));
const FrequencyUnlocker = lazyWithRetry(() => import('../components/FrequencyUnlocker'));
const FresnelCalculator = lazyWithRetry(() => import('../components/FresnelCalculator'));
const HarmonicsCalculator = lazyWithRetry(() => import('../components/HarmonicsCalculator'));
const UnitConverter = lazyWithRetry(() => import('../components/RFTools').then((module) => ({ default: module.UnitConverter })));

interface AppRoutesProps {
  currentUser: User | null;
  posts: Post[];
  categories: Array<{ id: string; name: string; icon: string; description: string }>;
  notifications: NotificationType[];
  vlogs: VlogEntry[];
  meetRooms: MeetRoomData[];
  loading: boolean;
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
  onAddVlog: (vlog: VlogEntry) => Promise<void>;
  onUpdateVlog: (id: string, data: Partial<VlogEntry>) => void;
  onDeleteVlog: (id: string) => void;
}

const RouteFallback: React.FC = () => (
  <div className="py-10 text-center text-slate-400 font-semibold uppercase tracking-widest">
    Loading...
  </div>
);

const MeetRoomPage: React.FC<{ rooms: MeetRoomData[]; user: User | null; onLoginRequest: () => void }> = ({ rooms, user, onLoginRequest }) => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const room = rooms.find((candidate) => candidate.id === roomId);
  if (!room) return <Navigate to="/meet" replace />;
  return <MeetRoom room={room} user={user} onLeave={() => navigate('/meet')} onLoginRequest={onLoginRequest} />;
};

const AppRoutes: React.FC<AppRoutesProps> = ({
  currentUser,
  posts,
  categories: _categories,
  notifications: _notifications,
  vlogs,
  meetRooms,
  loading: _loading,
  feedProps,
  onLoginRequest,
  onOpenCreatePost: _onOpenCreatePost,
  onOpenMarketModal: _onOpenMarketModal,
  onCreatePostModalClose,
  onMarketModalClose,
  onCreatePostSuccess,
  onMarketItemSuccess,
  isCreateOpen,
  isMarketModalOpen,
  onAddVlog,
  onUpdateVlog,
  onDeleteVlog,
}) => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Feed {...feedProps} />} />
          <Route path="/category/:categoryId" element={<Feed {...feedProps} />} />
          <Route path="/saved" element={<SavedPosts currentUser={currentUser} onToggleSave={feedProps.onToggleSave ?? (() => {})} onLoginClick={onLoginRequest} />} />
          <Route path="/u/:userId" element={<ProfilePage currentUser={currentUser} onToggleSave={feedProps.onToggleSave} />} />
          <Route path="/regulations" element={<RegulationsWiki onBack={() => navigate('/')} currentUser={currentUser} />} />
          <Route path="/wiki" element={<RegulationsWiki onBack={() => navigate('/')} currentUser={currentUser} />} />
          <Route path="/wiki/:articleId" element={<RegulationsWiki onBack={() => navigate('/regulations')} currentUser={currentUser} />} />
          <Route path="/tools/*" element={<ToolsHub />} />
          <Route path="/tools/betaflight" element={<Suspense fallback={<RouteFallback />}><BetaflightPresetTool /></Suspense>} />
          <Route path="/tools/pid" element={<Suspense fallback={<RouteFallback />}><PIDAnalyzer /></Suspense>} />
          <Route path="/tools/antenna" element={<Suspense fallback={<RouteFallback />}><AntennaTuner /></Suspense>} />
          <Route path="/tools/battery" element={<Suspense fallback={<RouteFallback />}><BatteryCalculator /></Suspense>} />
          <Route path="/tools/channels" element={<Suspense fallback={<RouteFallback />}><ChannelTuner /></Suspense>} />
          <Route path="/tools/unlocker" element={<Suspense fallback={<RouteFallback />}><FrequencyUnlocker /></Suspense>} />
          <Route path="/tools/fresnel" element={<Suspense fallback={<RouteFallback />}><FresnelCalculator /></Suspense>} />
          <Route path="/tools/harmonics" element={<Suspense fallback={<RouteFallback />}><HarmonicsCalculator /></Suspense>} />
          <Route path="/tools/converter" element={<Suspense fallback={<RouteFallback />}><UnitConverter /></Suspense>} />
          <Route path="/tools/rates" element={<div className="p-10 text-center text-slate-500">Rates Calculator Coming Soon</div>} />
          <Route path="/vlogs/*" element={<VlogSection vlogs={vlogs} currentUser={currentUser} onLoginClick={onLoginRequest} onOpenRoom={(id) => navigate(`/vlogs/${id}`)} onAddVlog={onAddVlog} onUpdateVlog={onUpdateVlog} onDeleteVlog={onDeleteVlog} />} />
          <Route path="/market" element={<MarketplaceList currentUser={currentUser} onLoginRequest={onLoginRequest} />} />
          <Route path="/market/category/:categoryId" element={<MarketplaceList currentUser={currentUser} onLoginRequest={onLoginRequest} />} />
          <Route path="/map" element={<SpotMap />} />
          <Route path="/chat" element={currentUser ? <GlobalChat currentUser={currentUser} onUserClick={(id) => navigate(`/u/${id}`)} onLoginClick={onLoginRequest} /> : <Navigate to="/" replace />} />
          <Route path="/meet" element={<MeetSection rooms={meetRooms} user={currentUser} onOpenRoom={(id) => navigate(`/meet/${id}`)} onLoginClick={onLoginRequest} />} />
          <Route path="/meet/:roomId" element={<MeetRoomPage rooms={meetRooms} user={currentUser} onLoginRequest={onLoginRequest} />} />
          <Route path="/admin" element={<AdminDashboard currentUser={currentUser} posts={posts} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
