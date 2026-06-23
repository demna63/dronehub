import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  getDocs,
  updateDoc,
  arrayUnion,
  increment,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getPerformance } from 'firebase/performance';
import { getFirebaseConfig } from './config';

const app = initializeApp(getFirebaseConfig());

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const perf = getPerformance(app);
export const googleProvider = new GoogleAuthProvider();

export const initializeUserProfile = async (user: any) => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { uid, displayName, email, photoURL } = user;
    await setDoc(userRef, {
      id: uid,
      name: displayName || 'Pilot',
      email: email || '',
      avatar: photoURL || '',
      reputation: 0,
      role: 'user',
      createdAt: serverTimestamp(),
      bio: '',
      location: '',
      gear: [],
    });
  }
};

export const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    await initializeUserProfile(res.user);
    return res.user;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Firebase auth error';
    console.error('Google Sign In Error', error);
    if (message.includes('unauthorized-domain') || message.includes('auth/unauthorized-domain')) {
      throw new Error('Google sign-in is not available on this domain yet. Please use demo mode or email login.');
    }
    throw error;
  }
};

export const registerWithEmail = async (name: string, email: string, pass: string) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
    await initializeUserProfile({ ...res.user, displayName: name });
    return res.user;
  } catch (error) {
    console.error('Registration Error', error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (error) {
    console.error('Login Error', error);
    throw error;
  }
};

export const signInWithDemo = async () => {
  try {
    const res = await signInAnonymously(auth);
    const demoName = `Demo Pilot ${Math.floor(Math.random() * 1000)}`;
    await updateProfile(res.user, { displayName: demoName });
    await initializeUserProfile({ ...res.user, displayName: demoName });
    return res.user;
  } catch (error) {
    console.error('Demo Sign In Error', error);
    throw error;
  }
};

export { collection, doc, getDoc, setDoc, addDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, runTransaction, getDocs, updateDoc, arrayUnion, increment };
export { signOut };
