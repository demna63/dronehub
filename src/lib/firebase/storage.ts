import type { FirebaseStorage } from 'firebase/storage';
import { app } from './index';

/**
 * Cloud Storage, loaded on first upload.
 *
 * Only signed-in users who post, list, build or change an avatar ever upload,
 * yet `getStorage(app)` in the eager Firebase init put the whole Storage SDK
 * on every first paint. The dynamic import gives it its own chunk (see
 * `manualChunks` in vite.config.ts), fetched the first time someone uploads.
 */
let storagePromise: Promise<{ storage: FirebaseStorage; sdk: typeof import('firebase/storage') }> | null = null;

const loadStorage = () => {
  if (!storagePromise) {
    storagePromise = import('firebase/storage')
      .then((sdk) => ({ storage: sdk.getStorage(app), sdk }))
      .catch((error: unknown) => {
        // A failed chunk fetch (offline, deploy mid-session) must not poison
        // every later upload attempt.
        storagePromise = null;
        throw error;
      });
  }
  return storagePromise;
};

/** Uploads `file` to `path` and returns its public download URL. */
export const uploadToStorage = async (path: string, file: Blob): Promise<string> => {
  const { storage, sdk } = await loadStorage();
  const fileRef = sdk.ref(storage, path);
  const result = await sdk.uploadBytes(fileRef, file);
  return sdk.getDownloadURL(result.ref);
};
