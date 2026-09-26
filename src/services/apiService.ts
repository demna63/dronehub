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
  getPostsByIdsFromFirestore,
  getPostsFromFirestore,
  getPostPageFromFirestore,
  countPostsByFacetFromFirestore,
  type PostCursor,
  type PostPage,
  type PostSort,
  getUserTelemetryVote,
  getPresetsFromFirestore,
  getSpotsFromFirestore,
  getSTLFilesFromFirestore,
  getUserDroneBuildsFromFirestore,
  getVlogsFromFirestore,
  markNotificationAsReadInFirestore,
  updateDroneBuildInFirestore,
  updatePostInFirestore,
  updateUserProfileInFirestore,
} from './firestoreRepository';
import { uploadImageToStorage, uploadProcessedImage } from './storageService';
import type { ProcessedImage, UploadedImage } from './storageService';
import type {
  User,
  Post,
  PostTelemetryVote,
  VlogEntry,
  MeetRoomData,
  DroneBuild,
  Spot,
  SpotDraft,
  StlFile,
  StlFileDraft,
} from '../types';
import { ratePost } from './telemetryService';
import { MARKET_CATEGORY } from '../constants/market';
import { PRIOR_MEAN } from '../utils/telemetry';
import { buildFacets, toFacet } from '../utils/facets';

export const apiService = {
  
  // ---------------------------------------------------------
  // 1. POSTS & FEED
  // ---------------------------------------------------------
  
  /**
   * One page of the feed.
   *
   * `facet` is a lowercased category, sub-category or tag; the filter runs in
   * the query rather than on the returned page, so the result does not depend
   * on how much of the feed is currently loaded.
   */
  async getPostPage(options: {
    sort?: PostSort;
    facet?: string | null;
    cursor?: PostCursor | null;
  } = {}): Promise<PostPage> {
    return getPostPageFromFirestore(options);
  },

  /** Number of posts in a facet (category, sub-category or tag). */
  async countPostsByFacet(facet: string): Promise<number> {
    return countPostsByFacetFromFirestore(toFacet(facet));
  },

  /**
   * The whole feed in one list, capped.
   *
   * Admin dashboard only — it reports totals across the site. Every
   * user-facing surface should page through `getPostPage`.
   */
  async getAllPosts(limitCount = 200, sort: PostSort = 'new'): Promise<Post[]> {
    return getPostsFromFirestore(limitCount, sort);
  },

  /** Fetch specific posts by id — one query per 30 ids, not a feed scan. */
  async getPostsByIds(postIds?: string[] | null): Promise<Post[]> {
    return getPostsByIdsFromFirestore(postIds ?? []);
  },

  async searchPosts(searchQuery: string): Promise<Post[]> {
    return await getPostsBySearchFromFirestore(searchQuery);
  },

  async addPost(data: {
    title: string;
    content: string;
    category: string;
    subCategory?: string;
    tags: string[];
    image: File | ProcessedImage | null;
    /** Only these three fields are persisted; the rest of `User` is not stored on a post. */
    author: Pick<User, 'id' | 'name' | 'avatar'>;
  }) {
    try {
      const uploaded = data.image ? await apiService.uploadImageWithMeta(data.image, 'posts') : null;

      const newPost = {
        title: data.title,
        content: data.content,
        category: data.category,
        subCategory: data.subCategory || '',
        tags: data.tags,
        // Flattened copy of category + subCategory + tags, lowercased. This is
        // what the feed filters on: Firestore cannot OR across three fields in
        // a query that also orders and paginates.
        facets: buildFacets({
          category: data.category,
          subCategory: data.subCategory,
          tags: data.tags,
        }),
        image: uploaded?.url ?? '',
        ...(uploaded && uploaded.width > 0 && uploaded.height > 0
          ? { imageWidth: uploaded.width, imageHeight: uploaded.height }
          : {}),
        
        authorId: data.author.id,
        author: data.author.name,
        authorAvatar: data.author.avatar || '',
        
        views: 0,
        commentsCount: 0, 
        comments: [], // ✅ დაემატა ცარიელი კომენტარების მასივი
        likes: 0,
        votes: 0,
        
        telemetry: {
          utility: 0,
          skill: 0,
          vision: 0,
          count: 0
        },
        // The neutral prior, written at creation and never by the client again.
        //
        // Firestore's `orderBy` omits documents that lack the field entirely, so
        // a post created without `telemetryScore` was invisible to the ranked
        // feed — and therefore unratable, which meant it could never acquire the
        // field either. It only appeared at all because the repository merged in
        // a second query whenever the ranked one came up short of the page size;
        // past 50 rated posts that merge stops firing and new posts disappear.
        //
        // `PRIOR_MEAN` is the same value `telemetryScore()` returns for an
        // unrated post, so this is the score the post already had implicitly.
        // firestore.rules pins it to exactly this constant on create.
        telemetryScore: PRIOR_MEAN,

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
    image: File | ProcessedImage | null;
    /** Only these three fields are persisted; the rest of `User` is not stored on a listing. */
    author: Pick<User, 'id' | 'name' | 'avatar'>;
  }) {
    try {
      const uploaded = data.image ? await apiService.uploadImageWithMeta(data.image, 'market') : null;
      const imageUrl = uploaded?.url ?? '';
      const marketTags = ['market', data.subCategory, data.brand].filter(Boolean);

      const newItem = {
        title: data.title,
        price: Number(data.price),
        content: data.content,
        category: MARKET_CATEGORY,
        subCategory: data.subCategory,
        condition: data.condition,
        brand: data.brand,
        location: data.location,
        phone: data.phone,
        image: imageUrl,
        ...(uploaded && uploaded.width > 0 && uploaded.height > 0
          ? { imageWidth: uploaded.width, imageHeight: uploaded.height }
          : {}),
        
        authorId: data.author.id,
        author: data.author.name,
        authorAvatar: data.author.avatar || '',
        
        views: 0,
        commentsCount: 0,
        comments: [],
        likes: 0,

        // Listings live in the same `posts` collection, so they must satisfy the
        // same create rule. Without these a market listing is rejected outright.
        telemetry: { utility: 0, skill: 0, vision: 0, count: 0 },
        telemetryScore: PRIOR_MEAN,

        createdAt: serverTimestamp(),
        tags: marketTags,
        facets: buildFacets({
          category: MARKET_CATEGORY,
          subCategory: data.subCategory,
          tags: marketTags,
        }),
      };

      await addPostToFirestore(newItem);
    } catch (error) {
      console.error("Error adding market item:", error);
      throw error;
    }
  },

  /**
   * Uploads an image and returns its URL together with intrinsic dimensions.
   * Accepts a `ProcessedImage` (already compressed at selection time) to avoid
   * a second lossy WebP re-encode on submit.
   */
  async uploadImageWithMeta(image: File | ProcessedImage, path: string = 'posts'): Promise<UploadedImage> {
    try {
      return image instanceof File
        ? await uploadImageToStorage(image, path)
        : await uploadProcessedImage(image, path);
    } catch (error) {
      console.error("Error optimizing/uploading image:", error);
      throw error;
    }
  },

  async uploadImage(file: File, path: string = 'posts'): Promise<string> {
    if (!file) return '';
    const { url } = await apiService.uploadImageWithMeta(file, path);
    return url;
  },

  /**
   * Record the caller's UTILITY/SKILL/VISION rating of a post.
   *
   * Goes through the ratePostV2 callable, never a direct client write: the
   * aggregate on the post is denormalised, so a client that could write it
   * could forge it. firestore.rules blocks `telemetry`, `telemetryScore` and
   * the votes subcollection for exactly that reason.
   */
  async ratePostTelemetry(postId: string, ratings: PostTelemetryVote) {
    return ratePost(postId, ratings);
  },

  async getUserTelemetryVote(postId: string, userId: string) {
    return getUserTelemetryVote(postId, userId);
  },

  // კომენტარის დამატება
  async addComment(postId: string, text: string, user: User, postAuthorId: string, postTitle: string): Promise<string | null> {
    const newComment = {
      author: user.name,
      authorId: user.id,
      avatar: user.avatar || '',
      text: text,
      likes: 0,
      timestamp: new Date().toLocaleDateString('ka-GE'),
      createdAt: new Date().toISOString()
    };

    const commentId = await addCommentToFirestore(postId, newComment);

    if (postAuthorId !== user.id) {
      await this.createNotification(postAuthorId, user, 'comment', postId, postTitle);
    }

    // The document id is what edit and delete address, so it goes back to the
    // caller rather than being invented client-side.
    return commentId;
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
  
  async getSpots(): Promise<Spot[]> {
    return (await getSpotsFromFirestore()) as Spot[];
  },

  async addSpot(spotData: SpotDraft, user: User) {
    try {
      const newSpot = {
        ...spotData,
        // The rule pins ownership to the caller. Without this the write was
        // rejected outright, and the UI only said "შეცდომა".
        authorId: user.id,
        author: spotData.author?.trim() || user.name,
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
    return await getUserDroneBuildsFromFirestore(userId);
  },

  async getVlogs(): Promise<VlogEntry[]> {
    return await getVlogsFromFirestore();
  },
  async getMeetRooms(): Promise<MeetRoomData[]> {
    return await getMeetRoomsFromFirestore();
  },
  async deleteDroneBuild(buildId: string): Promise<void> {
    await deleteDroneBuildFromFirestore(buildId);
  },

  async updateDroneBuild(
    buildId: string,
    buildData: Partial<DroneBuild>,
    imageFile?: File,
  ): Promise<void> {
    // Only touch `image` when a new file was actually picked. ProfilePage's
    // edit payload carries no `image` key, so defaulting to '' silently
    // discarded the existing photo on every save.
    let imageUrl: string | undefined = typeof buildData.image === 'string' ? buildData.image : undefined;
    if (imageFile) {
      imageUrl = await this.uploadImage(imageFile, 'builds');
    }

    // `sanitizeFirestoreData` strips undefined, so omitting `image` leaves the
    // stored value untouched rather than overwriting it with an empty string.
    await updateDroneBuildInFirestore(buildId, { ...buildData, image: imageUrl });
  },
  // STL ფაილების წამოღება
  async getSTLFiles(): Promise<StlFile[]> {
    return (await getSTLFilesFromFirestore()) as StlFile[];
  },
  // STL ფაილის და სურათის ატვირთვა
  async uploadSTLItem(data: StlFileDraft, imageFile: File, stlFile: File): Promise<void> {
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

  async addDroneBuild(
    buildData: Omit<DroneBuild, 'id' | 'image' | 'createdAt' | 'likes'>,
    imageFile: File | null,
    // `createdAt` is excluded from the return type on purpose: the value written
    // is a `serverTimestamp()` sentinel, which only resolves to a real time once
    // the document is read back. Handing it to the caller as if it were a
    // timestamp is how sentinels end up formatted as "Invalid Date".
  ): Promise<Omit<DroneBuild, 'createdAt'>> {
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
      const { createdAt: _createdAt, ...persisted } = newBuild;
      return { id: createdBuild.id, ...persisted };
    } catch (error) {
      console.error("Error adding build:", error);
      throw error;
    }
  }
};