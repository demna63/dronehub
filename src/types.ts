import type { TimestampLike } from './utils/dates';

// =====================
// 1. მომხმარებელი (User)
// =====================
export interface SocialLinks {
  instagram?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
  website?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  reputation: number;
  role?: 'admin' | 'moderator' | 'pilot';
  bio?: string;
  isVerified?: boolean;
  coverImage?: string;
  banner?: string;
  followers?: string[];
  following?: string[];
  followersCount?: number;
  followingCount?: number;
  lastSeen?: TimestampLike;
  createdAt?: TimestampLike;
  isAdmin?: boolean;
  location?: string;
  gear?: string[];
  savedPosts?: string[]; // <--- უბრალოდ დაამატეთ ეს ხაზი
  isBanned?: boolean; 
  
  // FPV Profile
  droneSetup?: string;
  favoriteSpot?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'pro' | 'experienced'; 
  droneInterests?: string[];
  socialLinks?: SocialLinks;
}

// =====================
// 2. კატეგორიები (Categories)
// =====================
export type CategoryID = string; 
export type SubCategoryID = string;
export type CategoryGroup = 'community' | 'official' | 'marketplace' | 'resources';

export interface Category {
  id: string;
  name: string;
  /** Translation key for `name`; falls back to `name` when absent. */
  nameKey?: string;
  icon: string;
  description: string;
  /** Translation key for `description`; falls back to `description` when absent. */
  descriptionKey?: string;
  memberCount?: number; // Legacy support
  membersCount?: number; 
  onlineCount?: number;
  coverImage?: string;
  banner?: string;
  subCategories?: { id: string; label: string; items?: string[] }[] | string[]; 
  slug?: string;
  label?: string; 
  group?: CategoryGroup;
}

// =====================
// 3. პოსტები (Posts & Comments)
// =====================

// ✅ რეიტინგის სტრუქტურა
/** Running sums of every rating, plus how many people rated. Never averages. */
export interface PostRatings {
  utility: number;
  skill: number;
  vision: number;
  count: number;
}

/** One user's own rating of one post, as stored in posts/{id}/votes/{uid}. */
export interface PostTelemetryVote {
  utility: number;
  skill: number;
  vision: number;
}

export interface Comment {
  id: string;
  author: string;
  authorId: string;
  authorReputation?: number;
  avatar: string;
  text: string;
  timestamp: string;
  votes: number;
  parentId?: string | null;
  replies?: Comment[];
  createdAt?: TimestampLike;
  /** Set by `updateCommentInFirestore`; absent on comments never edited. */
  editedAt?: unknown;
  likes: number;       // ✅ აი ეს ველი აკლდა
  authorName?: string;    
  authorAvatar?: string;
  postId: string;
}

export interface Post {
  id: string;
  author: string;
  authorId: string;
  authorReputation: number; 
  avatar: string;
  title: string;
  content: string;
  image?: string;
  /** Intrinsic size of `image`, persisted at upload time so the layout can be
   *  reserved before the bytes arrive (prevents cumulative layout shift). */
  imageWidth?: number;
  imageHeight?: number;
  category: string;
  tags: string[];
  /**
   * Lowercased union of `category`, `subCategory` and `tags`, written by
   * {@link buildFacets} at creation. The feed queries this with
   * `array-contains`; nothing should read it for display.
   *
   * Optional because documents created before the field existed may not carry
   * it until the backfill has run over them.
   */
  facets?: string[];
  votes: number; 
  userVote?: 'up' | 'down' | null;
  commentsCount: number;
  sharesCount?: number;
  views?: number;
  createdAt: TimestampLike;
  /**
   * `timestamp` used to be declared here as an optional pre-formatted string.
   * Nothing ever wrote it — `addPost` does not — so every reader fell through
   * to a "just now" default and old posts claimed to be new. Removed so the
   * field cannot be reached for again; `createdAt` is the only source.
   */
  /** Bayesian-shrunk 0-100 rating, written by the ratePost function. Sort key. */
  telemetryScore?: number;
  comments?: Comment[];
  authorAvatar?: string;
  // ✅ ტელემეტრიული რეიტინგი
  telemetry?: PostRatings;
  
  // Marketplace Fields
  price?: string;
  brand?: string;
  location?: string;
  contactInfo?: string;
  specs?: Record<string, string>;
  privacy?: 'public' | 'private';
  phone?: string;
  condition?: string; // 'new' | 'used' | 'damaged'
  subCategory?: string; // 'drones', 'parts', etc.
}


// =====================
// 4. ანგარი (Hangar / Builds)
// =====================
export interface DroneBuild {
  id: string;
  userId: string;
  name: string;
  frame: string;
  motors: string;
  fc_esc: string;
  vtx: string;
  camera: string;
  image?: string;
  status: 'flying' | 'broken' | 'wip';
  createdAt?: TimestampLike;
  likes?: number;
}

// =====================
// 5. ვლოგები და ჩატი (Vlogs & Chat)
// =====================
export interface VlogLink {
  platform: 'youtube' | 'instagram' | 'tiktok' | 'other';
  url: string;
  label?: string;
}

export interface VlogEntry {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  coverImage?: string;
  /** Legacy/in-memory field. `videoUrl` is what `addVlog` actually persists. */
  url: string;
  videoUrl?: string;
  content?: string;
  author: string;
  authorName: string;
  authorId: string;
  authorAvatar: string;
  avatar?: string;
  views: number;
  likes: number;
  engagement?: number;
  isTrending?: boolean;
  createdAt: TimestampLike;
  timestamp?: string; 
  duration?: string;
  links?: VlogLink[];
  comments?: Comment[];
}

// ✅ გაერთიანებული და გასწორებული VlogChatMessage
export interface VlogChatMessage {
  id: string;
  vlogId?: string; // Optional because it might be a global chat message
  roomId?: string; // Optional for Meet rooms
  
  // Author Info
  authorId: string;
  authorName: string;
  avatar: string;
  authorReputation?: number;
  
  // Message Info
  text: string;
  translatedText?: string;
  timestamp: string;
  createdAt: TimestampLike;

  // Legacy/Duplicate fields handling (Optional)
  userId?: string;     // Use authorId instead where possible
  userName?: string;   // Use authorName instead where possible
  userAvatar?: string; // Use avatar instead where possible
}

export interface ChatMessage {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  avatar: string;
  text: string;
  timestamp: string;
  authorReputation?: number;
}

// =====================
// 6. სხვა ტიპები (Wiki, FAQ, Notifications)
// =====================
export interface WikiEntry {
  id: string;
  title: string;
  excerpt: string; 
  image?: string; 
  content: string;
  category: 'regulations' | 'guides' | 'technical';
  lastUpdated: string;
  author: string;
  comments?: Comment[]; 
}

export interface FAQEntry {
  id?: string; 
  question: string;
  answer: string;
  category?: string;
}

export interface UserQuestion {
  id: string;
  userId: string;
  userName: string;
  author?: string; 
  question: string;
  text?: string; 
  answer?: string; 
  status: 'pending' | 'answered';
  createdAt: TimestampLike;
  timestamp?: string; 
}

export interface Notification {
  id: string;
  recipientId: string; // ვის მისდის
  senderId: string;    // ვინ გააგზავნა
  senderName: string;
  senderAvatar?: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'system' | 'mention' | 'vote';
  postId: string;
  postTitle: string;
  read: boolean;
  createdAt: TimestampLike;
  // userId და content ამოღებულია, რადგან ახალ სტრუქტურაში მათ postTitle და recipientId ანაცვლებს
}// ვინ გამოიწვია შეტყობინებ

export interface Preset {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  software: 'Lightroom' | 'Premiere' | 'Davinci' | 'LUTS' | 'Mobile';
  camera?: string; // მაგ: DJI Mini 3, GoPro
  price: 'free' | 'paid';
  priceAmount?: string; // მაგ: 15 GEL
  downloadUrl: string;
  authorId: string;
  authorName: string;
  createdAt: TimestampLike;
  command?: string; 
  tags?: string[];
}

export interface MeetRoomData {
  id: string;
  name: string;
  description: string;
  meetLink: string;
  coverImage: string;
  activeUsers: number;
  tags: string[];
  hostId?: string;
}

// =====================
// 9. STL კატალოგი (STL Catalog)
// =====================

/** A 3D-printable model published to the /stlFiles collection by an admin. */
export interface StlFile {
  id: string;
  title: string;
  type: string;
  frame: string;
  author: string;
  /** Preview image URL in Cloud Storage. */
  image: string;
  /** Direct download URL for the .stl binary in Cloud Storage. */
  downloadUrl: string;
  createdAt?: TimestampLike;
  /**
   * Legacy documents stored a pre-formatted date string instead of a
   * timestamp. Read-only: nothing writes this field any more.
   */
  date?: string;
}

/** The admin-supplied half of an STL upload; the URLs are filled in server-side. */
export type StlFileDraft = Pick<StlFile, 'title' | 'type' | 'frame' | 'author'>;

/** The half of a DroneBuild a user fills in; ids and timestamps are assigned on write. */
export type DroneBuildDraft = Omit<DroneBuild, 'id' | 'userId' | 'createdAt'>;

// =====================
// 10. რუკის ლოკაციები (Map spots)
// =====================

/** Spot categories the map knows how to colour; anything else falls back to the default pin. */
export type SpotType = 'bando' | 'cinematic' | 'racing' | 'open';

/** A flying location pinned on the community map. */
export interface Spot {
  id: string;
  name: string;
  type: SpotType | string;
  /** Current field name. */
  description?: string;
  /** Legacy field name kept for documents written before the rename. */
  desc?: string;
  warnings?: string;
  /** Display name of the submitter. */
  author?: string;
  /** Firestore uid of the submitter; the security rules pin this to the caller. */
  authorId?: string;
  lat: number;
  lng: number;
  createdAt?: TimestampLike;
}

/** The user-supplied half of a spot; ownership and timestamp are set server-side. */
export type SpotDraft = Pick<Spot, 'name' | 'type' | 'description' | 'warnings' | 'author' | 'lat' | 'lng'>;

// =====================
// 11. ამინდი (Flight weather)
// =====================

/**
 * Flight-relevant weather for Tbilisi, normalised from the Open-Meteo
 * response. Every field is already rounded for display.
 */
export interface FlightWeather {
  /** Celsius. */
  temp: number;
  /** km/h sustained. */
  wind: number;
  /** km/h gusting. */
  gusts: number;
  /** Degrees, meteorological convention (0 = from the north). */
  direction: number;
  /** Percent chance of precipitation. */
  rain: number;
  /** `HH:MM:SS` — today's sunset, or tomorrow's sunrise once the sun is down. */
  sunTime: string;
  isNight: boolean;
}