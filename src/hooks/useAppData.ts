import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, doc, getDoc, collection, query, where, orderBy, onSnapshot } from '../lib/firebase';
import { apiService } from '../services/apiService';
import type { MeetRoomData, Notification as NotificationType, Post, User, VlogEntry } from '../types';
import { readCachedData, writeCachedData } from '../utils/offlineCache';

export const useAppData = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [vlogs, setVlogs] = useState<VlogEntry[]>([]);
  const [meetRooms, setMeetRooms] = useState<MeetRoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(() => typeof window !== 'undefined' ? !window.navigator.onLine : false);

  useEffect(() => {
    const updateConnectivity = () => setIsOffline(!window.navigator.onLine);
    updateConnectivity();

    window.addEventListener('online', updateConnectivity);
    window.addEventListener('offline', updateConnectivity);

    return () => {
      window.removeEventListener('online', updateConnectivity);
      window.removeEventListener('offline', updateConnectivity);
    };
  }, []);

  useEffect(() => {
    const cachedPosts = readCachedData<Post[]>('posts');
    const cachedVlogs = readCachedData<VlogEntry[]>('vlogs');
    const cachedMeetRooms = readCachedData<MeetRoomData[]>('meetRooms');

    if (cachedPosts) setPosts(cachedPosts);
    if (cachedVlogs) setVlogs(cachedVlogs);
    if (cachedMeetRooms) setMeetRooms(cachedMeetRooms);
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const nextPosts = await apiService.getPosts();
      if (nextPosts.length > 0) {
        setPosts(nextPosts);
        writeCachedData('posts', nextPosts);
      } else {
        const cachedPosts = readCachedData<Post[]>('posts');
        if (cachedPosts && cachedPosts.length > 0) {
          setPosts(cachedPosts);
        } else {
          setPosts(nextPosts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      const cachedPosts = readCachedData<Post[]>('posts');
      if (cachedPosts) setPosts(cachedPosts);
    }
  }, []);

  const fetchVlogs = useCallback(async () => {
    try {
      const nextVlogs = await apiService.getVlogs();
      if (nextVlogs.length > 0) {
        setVlogs(nextVlogs);
        writeCachedData('vlogs', nextVlogs);
      } else {
        const cachedVlogs = readCachedData<VlogEntry[]>('vlogs');
        if (cachedVlogs && cachedVlogs.length > 0) {
          setVlogs(cachedVlogs);
        } else {
          setVlogs(nextVlogs);
        }
      }
    } catch (error) {
      console.error('Failed to fetch vlogs:', error);
      const cachedVlogs = readCachedData<VlogEntry[]>('vlogs');
      if (cachedVlogs) setVlogs(cachedVlogs);
    }
  }, []);

  const fetchMeetRooms = useCallback(async () => {
    try {
      const nextMeetRooms = await apiService.getMeetRooms();
      if (nextMeetRooms.length > 0) {
        setMeetRooms(nextMeetRooms);
        writeCachedData('meetRooms', nextMeetRooms);
      } else {
        const cachedMeetRooms = readCachedData<MeetRoomData[]>('meetRooms');
        if (cachedMeetRooms && cachedMeetRooms.length > 0) {
          setMeetRooms(cachedMeetRooms);
        } else {
          setMeetRooms(nextMeetRooms);
        }
      }
    } catch (error) {
      console.error('Failed to fetch meet rooms:', error);
      const cachedMeetRooms = readCachedData<MeetRoomData[]>('meetRooms');
      if (cachedMeetRooms) setMeetRooms(cachedMeetRooms);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setCurrentUser({ id: user.uid, ...userDocSnap.data() } as User);
        } else {
          setCurrentUser({
            id: user.uid,
            name: user.displayName || 'Pilot',
            avatar: user.photoURL || '',
            email: user.email || '',
            reputation: 0,
            isAdmin: false,
            role: 'pilot',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchVlogs();
    fetchMeetRooms();
  }, [fetchPosts, fetchVlogs, fetchMeetRooms]);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as NotificationType[]);
    }, (error) => {
      console.error('Notification listener error:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return {
    currentUser,
    setCurrentUser,
    posts,
    setPosts,
    notifications,
    setNotifications,
    vlogs,
    setVlogs,
    meetRooms,
    setMeetRooms,
    loading,
    isOffline,
    fetchPosts,
    fetchVlogs,
    fetchMeetRooms,
  };
};
