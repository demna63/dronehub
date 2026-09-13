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
import { getFirebaseConfig } from './config';

export const app = initializeApp(getFirebaseConfig());

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
/**
 * Firebase Performance Monitoring beacons to firebaselogging-pa.googleapis.com.
 * Initializing it eagerly put that request on the LCP critical path (it dominated
 * the critical request chain). Defer it to idle time after first paint and load the
 * SDK as its own dynamic chunk, so it never blocks rendering.
 */
const initPerformanceMonitoring = (): void => {
  if (typeof window === 'undefined') return;

  const start = (): void => {
    void import('firebase/performance')
      .then(({ getPerformance }) => getPerformance(app))
      .catch(() => {
        /* Performance monitoring is best-effort; never surface init failures. */
      });
  };

  const schedule = (): void => {
    // requestIdleCallback typing varies across TS lib targets; access it defensively.
    const idle = (window as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback;
    if (typeof idle === 'function') {
      idle(start, { timeout: 3000 });
    } else {
      window.setTimeout(start, 2000);
    }
  };

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
};

initPerformanceMonitoring();
export const googleProvider = new GoogleAuthProvider();

export const initializeUserProfile = async (user: any) => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { uid, displayName, photoURL } = user;
    // `email` is deliberately NOT stored here. It already lives in Firebase
    // Auth, nothing in the UI reads it from the profile, and while it was on
    // the document any signed-in account could read another member's address.
    await setDoc(userRef, {
      id: uid,
      name: displayName || 'Pilot',
      avatar: photoURL || '',
      reputation: 0,
      isAdmin: false,
      role: 'pilot',
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
