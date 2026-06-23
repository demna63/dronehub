/**
 * DB Schema Blueprints
 * These match the frontend `types.ts` to ensure end-to-end data integrity.
 */

export interface PostSchema {
  id: string;
  authorId: string;
  author: string;
  authorReputation: number;
  avatar: string;
  title: string;
  content: string;
  image?: string;
  votes: number;
  commentsCount: number;
  category: string;
  subCategory: string;
  tags: string[];
  timestamp: string;
  createdAt: Date;
  updatedAt: Date;
  // Store specific fields
  price?: string;
  priceHistory?: number[];
  condition?: 'new' | 'used';
  brand?: string;
  specs?: Record<string, string>;
}

export interface UserSchema {
  id: string;
  name: string;
  email: string;
  avatar: string;
  reputation: number;
  isAdmin: boolean;
  createdAt: Date;
}

export interface CommentSchema {
  id: string;
  author: string;
  authorId: string;
  avatar: string;
  text: string;
  votes: number;
  parentId?: string;
  timestamp: string;
  createdAt: Date;
}