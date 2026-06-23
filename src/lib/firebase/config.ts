import type { FirebaseOptions } from 'firebase/app';

type RuntimeConfig = {
  FIREBASE_AUTH_DOMAIN?: string;
  GEMINI_API_KEY?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

const getEnv = (key: keyof ImportMetaEnv): string => {
  const value = import.meta.env[key];
  return value || '';
};

const getRuntimeConfig = (): RuntimeConfig => {
  if (typeof window === 'undefined') return {};
  return window.__APP_CONFIG__ || {};
};

const getAuthDomain = (): string => {
  const configured = getEnv('VITE_FIREBASE_AUTH_DOMAIN') || getRuntimeConfig().FIREBASE_AUTH_DOMAIN || '';
  if (configured) return configured;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'localhost';
    return hostname;
  }

  return '';
};

export const getFirebaseConfig = (): FirebaseOptions => ({
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getAuthDomain(),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
});
