import React from 'react';

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
  lastSeen?: any;
  createdAt?: any;
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

export interface Telemetry {
  utility: number;
  skill: number;
  vision: number;
  count: number; // რამდენმა ადამიანმა მისცა ხმა ჯამში
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
  icon: string;
  description: string;
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
export interface PostRatings {
  utility: number;
  skill: number;
  vision: number;
  count: number;
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
  createdAt?: any;
  likes: number;       // ✅ აი ეს ველი აკლდა
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
  category: string;
  tags: string[];
  votes: number; 
  userVote?: 'up' | 'down' | null;
  commentsCount: number;
  sharesCount?: number;
  views?: number;
  createdAt: any;
  timestamp?: string;
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
  createdAt?: any;
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
  url: string;
  author: string;
  authorName: string;
  authorId: string;
  authorAvatar: string;
  avatar?: string;
  views: number;
  likes: number;
  engagement?: number;
  isTrending?: boolean;
  createdAt: any;
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
  createdAt: any;

  // Legacy/Duplicate fields handling (Optional)
  userId?: string;     // Use authorId instead where possible
  userName?: string;   // Use authorName instead where possible
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
  createdAt: any;
  timestamp?: string; 
}

export interface Notification {
  id: string;
  recipientId: string; // ვის მისდის
  senderId: string;    // ვინ გააგზავნა
  senderName: string;
  senderAvatar?: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'system' | 'mention' | 'vote';
  postId: string;
  postTitle: string;
  read: boolean;
  createdAt: any;
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
  createdAt: any;
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