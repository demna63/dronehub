import { Category, Post, Notification, User } from './types';

// ==========================================
// 1. POPULAR TAGS
// ==========================================
export const POPULAR_TAGS = [
  'FPV', 
  'Freestyle', 
  'Cinematic', 
  'Long Range', 
  'Racing', 
  'Build Log', 
  'Tutorial', 
  'Betaflight', 
  'Crash', 
  'Review', 
  'DJI', 
  'Analog', 
  'ELRS', 
  'GPS'
];

// ==========================================
// 2. CATEGORIES
// ==========================================
export const CATEGORIES: Category[] = [
  { 
    id: 'general', 
    name: 'ზოგადი', 
    label: 'ზოგადი',
    icon: 'Hash', 
    description: 'ზოგადი საუბრები დრონებზე', 
    group: 'community',
    slug: 'r/general',
    subCategories: []
  },
  { 
    id: 'fpv', 
    name: 'FPV', 
    label: 'FPV',
    icon: 'Activity', 
    description: 'First Person View დრონები, აწყობა, ფრენა', 
    group: 'community',
    slug: 'r/fpv',
    subCategories: [
      { id: 'freestyle', label: 'Freestyle' },
      { id: 'racing', label: 'Racing' },
      { id: 'long-range', label: 'Long Range' },
      { id: 'builds', label: 'Builds & Setup' }
    ]
  },
  { 
    id: 'racing', 
    name: 'Racing League', 
    label: 'Racing League',
    icon: 'Flag', 
    description: 'რბოლები, ტურნირები, შედეგები და ტრასები.',
    group: 'community',
    slug: 'r/racing',
    subCategories: [
      { id: 'events', label: 'Events' },
      { id: 'tracks', label: 'Track Design' },
      { id: 'laps', label: 'Lap Times' }
    ]
  },
  { 
    id: 'cinematic', 
    name: 'Cine Drone', 
    label: 'Cine Drone',
    icon: 'Camera', 
    description: 'სინემატიკური გადაღებები (DJI, Autel, etc.)', 
    group: 'community',
    slug: 'r/cine',
    subCategories: [
      { id: 'mavic', label: 'Mavic Series' },
      { id: 'mini', label: 'Mini Series' },
      { id: 'avata', label: 'Avata / FPV' },
      { id: 'photography', label: 'Photography Tips' }
    ]
  },
  { 
    id: 'marketplace', 
    name: 'მარკეტი', 
    label: 'მარკეტი',
    icon: 'ShoppingBag', 
    description: 'ყიდვა-გაყიდვა', 
    group: 'marketplace',
    slug: 'r/market',
    subCategories: [
      { id: 'drones', label: 'დრონები' },
      { id: 'parts', label: 'ნაწილები' },
      { id: 'goggles', label: 'სათვალეები' }
    ]
  },
  { 
    id: 'help', 
    name: 'დახმარება', 
    label: 'დახმარება',
    icon: 'HelpCircle', 
    description: 'კითხვა-პასუხი და დახმარება', 
    group: 'resources',
    slug: 'r/help',
    subCategories: []
  },
  { 
    id: 'events', 
    name: 'Events', 
    label: 'Events',
    icon: 'Calendar', 
    description: 'შეკრებები, ღონისძიებები და ფრენის დღეები.',
    group: 'resources',
    slug: 'r/events',
    subCategories: [
      { id: 'local', label: 'Local' },
      { id: 'inter', label: 'International' }
    ]
  },
  { 
    id: 'stores', 
    name: 'Local Stores', 
    label: 'Local Stores',
    icon: 'ShoppingCart', 
    description: 'პარტნიორი მაღაზიები და ოფიციალური დილერები.',
    group: 'resources',
    slug: 'r/stores',
    subCategories: [
      { id: 'dronehub', label: 'DroneHub Store' },
      { id: 'partners', label: 'Partner Deals' }
    ]
  }
];

// ==========================================
// 3. MOCK POSTS
// ==========================================
export const MOCK_POSTS: Post[] = [];

// ==========================================
// 4. MOCK NOTIFICATIONS
// ==========================================
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    recipientId: 'current-user-id',
    senderId: 'u1',
    senderName: 'პილოტი #1',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=P1',
    type: 'vote',
    postId: 'p1',
    postTitle: 'პირველი ფრენა',
    read: false,
    createdAt: new Date()
  },
  {
    id: 'n2',
    recipientId: 'current-user-id',
    senderId: 'u2',
    senderName: 'პილოტი #2',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=P2',
    type: 'comment',
    postId: 'p1',
    postTitle: 'პირველი ფრენა',
    read: true,
    createdAt: new Date(Date.now() - 3600000)
  },
  {
    id: 'n3',
    recipientId: 'current-user-id',
    senderId: 'system',
    senderName: 'DroneHub',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DroneHub',
    type: 'system',
    postId: 'regulations',
    postTitle: 'წესები და რეგულაციები',
    read: true, 
    createdAt: new Date(Date.now() - 86400000)
  }
];

// ==========================================
// 5. MOCK USERS
// ==========================================
export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Nika Pro',
    email: 'nika@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nika',
    reputation: 1250,
    role: 'moderator',
    bio: 'Professional FPV Pilot',
    isVerified: true
  },
  {
    id: 'u2',
    name: 'Sandro FPV',
    email: 'sandro@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sandro',
    reputation: 980,
    role: 'pilot',
    bio: 'Long range explorer',
    isVerified: false
  },
  {
    id: 'u3',
    name: 'Data Drone',
    email: 'data@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Data',
    reputation: 890,
    role: 'pilot',
    bio: 'Tech enthusiast',
    isVerified: false
  }
];