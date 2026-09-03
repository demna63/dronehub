import type { FirebaseOptions } from 'firebase/app';

type RuntimeConfig = {
  FIREBASE_AUTH_DOMAIN?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

// SECURITY: only STATIC `import.meta.env.VITE_*` reads — never `import.meta.env[key]`.
// Dynamic lookups force Vite to inline the entire env object (including secrets).
const getRuntimeConfig = (): RuntimeConfig => {
  if (typeof window === 'undefined') return {};
  return window.__APP_CONFIG__ || {};
};

const getAuthDomain = (): string => {
  const configured =
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || getRuntimeConfig().FIREBASE_AUTH_DOMAIN || '';
  if (configured) return configured;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'localhost';
    return hostname;
  }

  return '';
};

export const getFirebaseConfig = (): FirebaseOptions => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: getAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});
