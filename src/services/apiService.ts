import { serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../lib/firebase';
import {
  addCommentToFirestore,
  addDroneBuildToFirestore,
  addPostToFirestore,
  addSpotToFirestore,
  addSTLItemToFirestore,
  addVlogToFirestore,
  createNotificationInFirestore,
  deleteDroneBuildFromFirestore,
  deletePostFromFirestore,
  getMeetRoomsFromFirestore,
  getPostsBySearchFromFirestore,
  getPostsFromFirestore,
  getPresetsFromFirestore,
  getSpotsFromFirestore,
  getSTLFilesFromFirestore,
  getUserDroneBuildsFromFirestore,
  getVlogsFromFirestore,
  markNotificationAsReadInFirestore,
  ratePostTelemetryInFirestore,
  updateDroneBuildInFirestore,
  updatePostInFirestore,
  updateUserProfileInFirestore,
} from './firestoreRepository';
import { uploadImageToStorage } from './storageService';
import type { User, Post, VlogEntry, MeetRoomData } from '../types';

export const apiService = {
  
  // ---------------------------------------------------------
  // 1. POSTS & FEED
  // ---------------------------------------------------------
  
  async getPosts(): Promise<Post[]> {
    try {
      return await getPostsFromFirestore(50);
    } catch (error) {
      console.error("Error fetching posts:", error);
      return [];
    }
  },

  async searchPosts(searchQuery: string): Promise<Post[]> {
    try {
      return await getPostsBySearchFromFirestore(searchQuery);
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  },

  async addPost(data: {
    title: string;
    content: string;
    category: string;
    subCategory?: string;
    tags: string[];
    image: File | null;
    author: User; 
  }) {
    try {
      let imageUrl = '';
      if (data.image) {
        imageUrl = await apiService.uploadImage(data.image, 'posts');
      }

      const newPost = {
        title: data.title,
        content: data.content,
        category: data.category,
        subCategory: data.subCategory || '',
        tags: data.tags,
        image: imageUrl,
        
        authorId: data.author.id,
        author: data.author.name,
        authorAvatar: data.author.avatar || '',
        
        views: 0,
        commentsCount: 0, 
        comments: [], // ✅ დაემატა ცარიელი კომენტარების მასივი
        likes: 0,
        votes: 0,
        
        // ✅ ტელემეტრია გადავიდა ერთ ობიექტში, რასაც Frontend ითხოვს
        telemetry: {
          utility: 0,
          skill: 0,
          vision: 0,
          count: 0
        },

        createdAt: serverTimestamp()
      };

      await addPostToFirestore(newPost);
      
    } catch (error) {
      console.error("Error adding post:", error);
      throw error;
    }
  },
  async updatePost(postId: string, newContent: string): Promise<void> {
    await updatePostInFirestore(postId, {
      content: newContent,
      isEdited: true
    });
  },

  async deletePost(postId: string) {
    try {
      await deletePostFromFirestore(postId);
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },

  // ---------------------------------------------------------
  // 2. USER PROFILE
  // --------------------------------------------
async updateUserProfile(userId: string, data: Partial<User>) {
try {
  if (!userId) throw new Error("User ID is required");
  await updateUserProfileInFirestore(userId, data);
  return true;
} catch (error) {
  console.error("Error updating profile:", error);
  throw error;
}
},
  // ---------------------------------------------------------
  // 3. VLOGS
  // ---------------------------------------------------------

  async addVlog(videoUrl: string, title: string, user: User) {
    let videoId = videoUrl;
    try {
      const urlObj = new URL(videoUrl);
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || videoId;
      } else if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      }
    } catch (_e) {
      // Not a URL — treat the input as a raw video ID
    }
    
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    const vlogData = {
      title,
      content: videoUrl,
      videoUrl,
      thumbnail,
      authorId: user.id,
      author: user.name,
      authorAvatar: user.avatar,
      category: 'vlog',
      type: 'vlog',
      likes: 0,
      comments: [],
      views: 0,
      createdAt: serverTimestamp()
    };

    const createdVlog = await addVlogToFirestore(vlogData);
    
    const now = new Date();
    return {
      id: createdVlog.id,
      ...vlogData,
      comments: [],
      url: videoUrl,
      authorName: user.name,
      createdAt: { toDate: () => now, seconds: Math.floor(now.getTime() / 1000) }
    };
  },

  // ---------------------------------------------------------
  // 4. MARKETPLACE
  // ---------------------------------------------------------

  async addMarketItem(data: {
    title: string;
    price: number;
    subCategory: string;
    condition: string;
    brand: string;
    location: string;
    phone: string;
    content: string;
    image: File | null;
    author: User;
  }) {
    try {
      let imageUrl = '';
      if (data.image) {
        imageUrl = await apiService.uploadImage(data.image, 'market');
      }

      const newItem = {
        title: data.title,
        price: Number(data.price),
        content: data.content,
        category: 'marketplace',
        subCategory: data.subCategory,
        condition: data.condition,
        brand: data.brand,
        location: data.location,
        phone: data.phone,
        image: imageUrl,
        
        authorId: data.author.id,
        author: data.author.name,
        authorAvatar: data.author.avatar || '',
        
        views: 0,
        commentsCount: 0,
        comments: [],
        likes: 0,
        
        createdAt: serverTimestamp(),
        tags: ['market', data.subCategory, data.brand].filter(Boolean)
      };

      await addPostToFirestore(newItem);
    } catch (error) {
      console.error("Error adding market item:", error);
      throw error;
    }
  },

  async uploadImage(file: File, path: string = 'posts'): Promise<string> {
    if (!file) return '';
    try {
      return await uploadImageToStorage(file, path);
    } catch (error) {
      console.error("Error optimizing/uploading image:", error);
      throw error;
    }
  },

  async ratePostTelemetry(postId: string, userId: string, category: string,voteValue: number, authorId: string, postTitle: string, currentUser: User) {
    await ratePostTelemetryInFirestore(postId, category, voteValue);

    if (authorId !== userId) {
      await this.createNotification(authorId, currentUser, 'vote', postId, postTitle);
    }
  },

  // კომენტარის დამატება
  async addComment(postId: string, text: string, user: User, postAuthorId: string, postTitle: string) {
    const newComment = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      author: user.name,
      authorId: user.id,
      avatar: user.avatar || '',
      text: text,
      likes: 0,
      timestamp: new Date().toLocaleDateString('ka-GE'),
      createdAt: new Date().toISOString()
    };

    await addCommentToFirestore(postId, newComment);

    if (postAuthorId !== user.id) {
      await this.createNotification(postAuthorId, user, 'comment', postId, postTitle);
    }
  },

  // ---------------------------------------------------------
  // 6. NOTIFICATIONS
  // ---------------------------------------------------------

  async createNotification(
    recipientId: string, 
    sender: User, 
    type: 'like' | 'comment' | 'vote' | 'system', 
    postId: string, 
    postTitle: string
  ) {
    try {
      await createNotificationInFirestore({
        recipientId,
        senderId: sender.id,
        senderName: sender.name,
        senderAvatar: sender.avatar || '',
        type,
        postId,
        postTitle,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error creating notification", e);
    }
  },

  async markNotificationAsRead(notificationId: string) {
    try {
      await markNotificationAsReadInFirestore(notificationId);
    } catch (e) {
      console.error("Error marking as read", e);
    }
  },

  // ---------------------------------------------------------
  // 7. TOOLS & PRESETS
  // ---------------------------------------------------------

  // Demo presets shown when Firestore collection is empty
  _demoPresets: [
    {
      id: 'demo-1',
      title: 'Cinematic Smooth 5"',
      author: 'Nika Pro',
      authorName: 'Nika Pro',
      authorId: 'demo',
      type: 'betaflight',
      description: 'Super smooth PID tune for 5 inch freestyle drones with GoPro.',
      software: 'Betaflight 4.5',
      thumbnail: 'https://images.unsplash.com/photo-1506947411487-a56738267384?auto=format&fit=crop&q=80&w=400',
      price: 'free' as const,
      downloads: 120,
      downloadUrl: '#',
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-2',
      title: 'Racing Aggressive',
      author: 'Gio FPV',
      authorName: 'Gio FPV',
      authorId: 'demo',
      type: 'betaflight',
      description: 'Locked in tune for racing tracks. High feedforward.',
      software: 'Betaflight 4.4',
      thumbnail: 'https://images.unsplash.com/photo-1574676527582-76679585d852?auto=format&fit=crop&q=80&w=400',
      price: 'free' as const,
      downloads: 85,
      downloadUrl: '#',
      createdAt: new Date().toISOString()
    }
  ],

  async getPresets() {
    try {
      const presets = await getPresetsFromFirestore();
      if (presets.length > 0) {
        return presets;
      }
      return this._demoPresets;
    } catch (error) {
      console.error("Error fetching presets:", error);
      return this._demoPresets;
    }
  },

  async getCategories() {
    return [];
  },
  
  async getSpots() {
    try {
      return await getSpotsFromFirestore();
    } catch (error) {
      console.error("Error fetching spots:", error);
      return [];
    }
  },

  async addSpot(spotData: any) {
    try {
      const newSpot = {
        ...spotData,
        createdAt: serverTimestamp()
      };
      const createdSpot = await addSpotToFirestore(newSpot);
      return { id: createdSpot.id, ...newSpot };
    } catch (error) {
      console.error("Error adding spot:", error);
      throw error;
    }
  },
  // ---------------------------------------------------------
  // 9. DRONE BUILDS (GARAGE)
  // ---------------------------------------------------------
  
  async getUserDroneBuilds(userId: string) {
    try {
      return await getUserDroneBuildsFromFirestore(userId);
    } catch (error) {
      console.error("Error fetching builds:", error);
      return [];
    }
  },

  async getVlogs(): Promise<VlogEntry[]> {
    try {
      return await getVlogsFromFirestore();
    } catch (error) {
      console.error("Error fetching vlogs:", error);
      return [];
    }
  },
  async getMeetRooms(): Promise<MeetRoomData[]> {
    try {
      return await getMeetRoomsFromFirestore();
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return [];
    }
  },
  async deleteDroneBuild(buildId: string): Promise<void> {
    await deleteDroneBuildFromFirestore(buildId);
  },

  async updateDroneBuild(buildId: string, buildData: any, imageFile?: File): Promise<void> {
    let imageUrl: string = buildData.image || '';
    if (imageFile) {
      imageUrl = await this.uploadImage(imageFile, 'builds');
    }

    await updateDroneBuildInFirestore(buildId, { ...buildData, image: imageUrl });
  },
  // STL ფაილების წამოღება
  async getSTLFiles(): Promise<any[]> {
    try {
      return await getSTLFilesFromFirestore();
    } catch (error) {
      console.error("Error fetching STL files:", error);
      return [];
    }
  },
  // STL ფაილის და სურათის ატვირთვა
  async uploadSTLItem(data: any, imageFile: File, stlFile: File): Promise<void> {
    try {
      const imageRef = ref(storage, `stl_images/${Date.now()}_${imageFile.name}`);
      const imageUploadResult = await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(imageUploadResult.ref);

      const stlRef = ref(storage, `stl_files/${Date.now()}_${stlFile.name}`);
      const stlUploadResult = await uploadBytes(stlRef, stlFile);
      const stlUrl = await getDownloadURL(stlUploadResult.ref);

      await addSTLItemToFirestore({
        title: data.title,
        type: data.type,
        frame: data.frame,
        author: data.author,
        image: imageUrl,
        downloadUrl: stlUrl,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error uploading STL item:", error);
      throw error;
    }
  },

  async addDroneBuild(buildData: any, imageFile: File | null) {
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await this.uploadImage(imageFile, 'builds');
      }

      const newBuild = {
        ...buildData,
        image: imageUrl,
        createdAt: serverTimestamp(),
        likes: 0
      };

      const createdBuild = await addDroneBuildToFirestore(newBuild);
      return { id: createdBuild.id, ...newBuild };
    } catch (error) {
      console.error("Error adding build:", error);
      throw error;
    }
  }
};