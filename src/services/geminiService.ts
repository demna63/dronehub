import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase';

type GeminiAction = 'analyzePost' | 'checkZoneWithAI' | 'translateText' | 'checkRestrictedZone';

type GeminiRequest = {
  action: GeminiAction;
  payload: Record<string, unknown>;
};

type GeminiResponse = {
  result: unknown;
};

let functionsInstance: ReturnType<typeof getFunctions> | null = null;

const getCallable = () => {
  if (!functionsInstance) {
    functionsInstance = getFunctions(app, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1');
  }
  return httpsCallable<GeminiRequest, GeminiResponse>(functionsInstance, 'geminiProxy');
};

const callGeminiProxy = async (action: GeminiAction, payload: Record<string, unknown>) => {
  const callable = getCallable();
  const response = await callable({ action, payload });
  return response.data.result;
};

/**
 * The proxy now requires a signed-in caller and enforces a daily budget per
 * account, so those two rejections are ordinary states, not bugs — the caller
 * shows this text instead of a generic "unavailable" fallback.
 */
export const describeGeminiError = (error: unknown): string | null => {
  const code = (error as { code?: string })?.code;
  if (code === 'functions/unauthenticated') return 'ამ ფუნქციისთვის გაიარე ავტორიზაცია.';
  if (code === 'functions/resource-exhausted') return 'დღიური ლიმიტი ამოიწურა. სცადე ხვალ.';
  return null;
};

const getDevGeminiApiKey = (): string | null => {
  if (!import.meta.env.DEV) return null;

  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here') return null;
  return key;
};

const callGeminiDirect = async (prompt: string, json = false) => {
  const apiKey = getDevGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API is only available through the server proxy in production.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        ...(json ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

const isGeminiAvailable = (): boolean => {
  if (import.meta.env.DEV && getDevGeminiApiKey()) return true;
  return Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);
};

export const geminiService = {
  isAvailable(): boolean {
    return isGeminiAvailable();
  },

  async analyzePost(title: string, content: string) {
    const fallback = { suggestedCategory: 'general', suggestedSubCategory: '', tags: [], summary: '' };

    try {
      if (import.meta.env.DEV && getDevGeminiApiKey()) {
        const prompt = `Analyze this drone community post.\nTitle: "${title}"\nContent: "${content}"\nReturn JSON with suggestedCategory, suggestedSubCategory, tags (max 5), summary in Georgian (max 100 chars).`;
        const jsonStr = await callGeminiDirect(prompt, true);
        return JSON.parse(jsonStr || '{}');
      }

      return await callGeminiProxy('analyzePost', { title, content });
    } catch (error) {
      console.error('[Gemini] Analysis error:', error);
      return fallback;
    }
  },

  async checkZoneWithAI(lat: number, lng: number) {
    const fallback = { status: 'CAUTION', message: 'სერვისი კონფიგურირებული არ არის. იფრინეთ სიფრთხილით.' };

    try {
      if (import.meta.env.DEV && getDevGeminiApiKey()) {
        const prompt = `I am a drone pilot in Georgia. Coordinates: ${lat}, ${lng}. Return JSON: {"status":"RESTRICTED"|"CAUTION"|"CLEAR","message":"Georgian max 20 words"}`;
        const jsonStr = await callGeminiDirect(prompt, true);
        return JSON.parse(jsonStr || '{}');
      }

      return await callGeminiProxy('checkZoneWithAI', { lat, lng });
    } catch (error) {
      console.error('[Gemini] Zone check error:', error);
      const reason = describeGeminiError(error);
      return reason ? { status: 'CAUTION', message: reason } : fallback;
    }
  },

  async translateText(text: string) {
    try {
      if (import.meta.env.DEV && getDevGeminiApiKey()) {
        const prompt = `Translate to English (if Georgian) or Georgian (if English), drone pilot slang ok: "${text}"`;
        return await callGeminiDirect(prompt);
      }

      return await callGeminiProxy('translateText', { text });
    } catch (error) {
      console.error('Translation failed', error);
      return text;
    }
  },

  async checkRestrictedZone(query: string) {
    const fallback = { status: 'CAUTION', message: 'ვერ მოხერხდა შემოწმება.' };

    try {
      if (import.meta.env.DEV && getDevGeminiApiKey()) {
        const prompt = `Drone pilot in Georgia asks about: "${query}". Return JSON status RESTRICTED|CAUTION|CLEAR and Georgian message max 20 words.`;
        const jsonStr = await callGeminiDirect(prompt, true);
        return JSON.parse(jsonStr || '{}');
      }

      return await callGeminiProxy('checkRestrictedZone', { query });
    } catch (error) {
      console.error('[Gemini] Restricted-zone check error:', error);
      const reason = describeGeminiError(error);
      return reason ? { status: 'CAUTION', message: reason } : fallback;
    }
  },
};
