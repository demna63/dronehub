import { Post, VlogEntry, User, Category, VlogChatMessage } from './types';
import { MOCK_POSTS, CATEGORIES as MOCK_CATEGORIES } from './constants';
import { 
  db, collection, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, 
  query, orderBy, limit, where, serverTimestamp 
} from './lib/firebase';

class DatabaseEngine {
  private onlineUserIds: Set<string> = new Set();

  constructor() {
    console.debug('[DB] Initializing Firestore Bridge');
    this.onlineUserIds.add('user_001');
  }

  // --- Vlog Chat ---
  async getVlogChat(vlogId: string): Promise<VlogChatMessage[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, 'global_messages'), where('vlogId', '==', vlogId), orderBy('createdAt', 'asc'), limit(50));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.createdAt?.toDate().toLocaleTimeString() || 'Just now'
        } as VlogChatMessage;
      });
    } catch (e) {
      return [];
    }
  }

  async addVlogChatMessage(message: VlogChatMessage): Promise<VlogChatMessage> {
    if (!db) return message;
    try {
      const docRef = await addDoc(collection(db, 'global_messages'), {
        ...message,
        createdAt: serverTimestamp()
      });
      return { ...message, id: docRef.id };
    } catch (e) {
      return message;
    }
  }

  // --- Posts ---
  async getPosts(): Promise<Post[]> {
    if (!db) return MOCK_POSTS;
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return MOCK_POSTS;
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    } catch (e) {
      return MOCK_POSTS;
    }
  }

  async getPostById(id: string): Promise<Post | undefined> {
    if (!db) return MOCK_POSTS.find(p => p.id === id);
    try {
      const d = await getDoc(doc(db, 'posts', id));
      if (d.exists()) return { id: d.id, ...d.data() } as Post;
      return undefined;
    } catch (e) { return undefined; }
  }

  async createPost(post: Post): Promise<Post> {
    if (!db) return post;
    try {
      const docRef = await addDoc(collection(db, 'posts'), {
        ...post,
        createdAt: serverTimestamp(),
        votes: 0,
        commentsCount: 0
      });
      return { ...post, id: docRef.id };
    } catch (e) { return post; }
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | null> {
    if (!db) return null;
    try {
      await setDoc(doc(db, 'posts', id), updates, { merge: true });
      return await this.getPostById(id) || null;
    } catch (e) { return null; }
  }

  async deletePost(id: string): Promise<boolean> {
    if (!db) return false;
    try {
      await deleteDoc(doc(db, 'posts', id));
      return true;
    } catch (e) { return false; }
  }

  // --- Categories ---
  async getCategories(): Promise<Category[]> {
    if (!db) return MOCK_CATEGORIES;
    try {
      const snapshot = await getDocs(collection(db, 'categories'));
      if (snapshot.empty) {
        MOCK_CATEGORIES.forEach(cat => setDoc(doc(db, 'categories', cat.id), cat));
        return MOCK_CATEGORIES;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    } catch (e) { return MOCK_CATEGORIES; }
  }

  async saveCategory(category: Category): Promise<Category> {
    if (!db) return category;
    try {
      await setDoc(doc(db, 'categories', category.id), category, { merge: true });
      return category;
    } catch (e) { return category; }
  }

  async deleteCategory(id: string): Promise<boolean> {
    if (!db) return false;
    try {
      await deleteDoc(doc(db, 'categories', id));
      return true;
    } catch (e) { return false; }
  }

  // --- Users ---
  async getUserById(id: string): Promise<User | undefined> {
    if (!db) return undefined;
    try {
      const d = await getDoc(doc(db, 'users', id));
      if (d.exists()) return { id: d.id, ...d.data() } as User;
      return undefined;
    } catch (e) { return undefined; }
  }

  async saveUser(user: User): Promise<User> {
    if (!db) return user;
    try {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
      return user;
    } catch (e) { return user; }
  }

  async getOnlineUsers(): Promise<User[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, 'users'), orderBy('lastSeen', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (e) { return []; }
  }

  // --- Vlogs ---
  async getVlogs(): Promise<VlogEntry[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, 'vlogs'), limit(20));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VlogEntry));
    } catch (e) { return []; }
  }
}

export const dbEngine = new DatabaseEngine();
export const dbWrapper = dbEngine; 
export { dbEngine as db };