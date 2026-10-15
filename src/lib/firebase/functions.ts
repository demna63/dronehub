import type { Functions, HttpsCallable } from 'firebase/functions';
import { app } from './index';

/**
 * Cloud Functions client, loaded on first call.
 *
 * Callables run only on a rating or an AI action, yet a static import kept the
 * Functions SDK in the eager bundle of every page. The dynamic import gives it
 * its own chunk (see `manualChunks` in vite.config.ts).
 */
let functionsPromise: Promise<{ functions: Functions; sdk: typeof import('firebase/functions') }> | null = null;

const loadFunctions = () => {
  if (!functionsPromise) {
    functionsPromise = import('firebase/functions')
      .then((sdk) => ({
        functions: sdk.getFunctions(app, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1'),
        sdk,
      }))
      .catch((error: unknown) => {
        // A failed chunk fetch must not poison every later call.
        functionsPromise = null;
        throw error;
      });
  }
  return functionsPromise;
};

export const getCallable = async <Req, Res>(name: string): Promise<HttpsCallable<Req, Res>> => {
  const { functions, sdk } = await loadFunctions();
  return sdk.httpsCallable<Req, Res>(functions, name);
};
