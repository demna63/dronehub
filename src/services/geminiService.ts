import { GoogleGenAI, Type } from "@google/genai";

const getGeminiApiKey = (): string => {
  const runtimeConfig = typeof window !== 'undefined' ? (window as Window & { __APP_CONFIG__?: { GEMINI_API_KEY?: string } }).__APP_CONFIG__ : undefined;
  const envConfig = import.meta.env as ImportMetaEnv & Record<string, string | undefined>;
  const candidates = [
    runtimeConfig?.GEMINI_API_KEY,
    envConfig.VITE_GEMINI_API_KEY,
    envConfig.GEMINI_API_KEY,
  ];

  const key = candidates.find((candidate): candidate is string => Boolean(candidate && candidate.trim() && candidate !== 'your_gemini_api_key_here'));

  if (!key) {
    console.error('[Gemini] API key not found in environment variables');
    throw new Error('Gemini API not configured. Add a real VITE_GEMINI_API_KEY value to your environment or runtime config.');
  }

  return key;
};

// Initialize once
let geminiClient: GoogleGenAI | null = null;

const getGeminiClient = (): GoogleGenAI => {
  if (!geminiClient) {
    const apiKey = getGeminiApiKey();
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
};

/**
 * Check if Gemini service is available
 */
const isGeminiAvailable = (): boolean => {
  try {
    getGeminiApiKey();
    return true;
  } catch {
    return false;
  }
};

export const geminiService = {
  /**
   * Check if service is configured
   */
  isAvailable: isGeminiAvailable,

  /**
   * Analyze post content and suggest categorization
   */
  async analyzePost(title: string, content: string) {
    if (!isGeminiAvailable()) {
      console.warn('[Gemini] Service not available, skipping analysis');
      return { suggestedCategory: 'general', suggestedSubCategory: '', tags: [], summary: '' };
    }

    const client = getGeminiClient();
    
    const prompt = `
      Analyze this drone community post.
      Title: "${title}"
      Content: "${content}"
      
      Return JSON with:
      - suggestedCategory: one of ['general', 'fpv', 'cinematic', 'marketplace', 'help', 'racing']
      - suggestedSubCategory: string (based on content)
      - tags: array of strings (max 5)
      - summary: short summary in Georgian (max 100 chars)
    `;

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const jsonStr = response.text || '{}';
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('[Gemini] Analysis error:', error);
      return { suggestedCategory: 'general', suggestedSubCategory: '', tags: [], summary: '' };
    }
  },

  /**
   * Check Zone with AI (Coordinates based)
   */
  async checkZoneWithAI(lat: number, lng: number) {
    // Fix: guard against missing API key, consistent with other methods
    if (!isGeminiAvailable()) {
      return { status: 'CAUTION', message: 'სერვისი კონფიგურირებული არ არის. იფრინეთ სიფრთხილით.' };
    }
    const client = getGeminiClient();
    
    const prompt = `
      I am a drone pilot in Georgia (Country).
      Coordinates: ${lat}, ${lng}.
      
      Analyze this location. Is it a restricted No-Fly Zone?
      Check for: Airports (CTR), Military bases, Government buildings, National Parks, Borders.
      
      Return JSON:
      {
        "status": "RESTRICTED" | "CAUTION" | "CLEAR",
        "message": "Short explanation in Georgian language (max 20 words)."
      }
    `;

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["RESTRICTED", "CLEAR", "CAUTION"] },
              message: { type: Type.STRING }
            },
            required: ['status', 'message']
          }
        }
      });
      
      const jsonStr = response.text || '{}';
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('[Gemini] Zone check error:', error);
      return { 
        status: "CAUTION", 
        message: "სერვისი დროებით მიუწვდომელია. იფრინეთ სიფრთხილით." 
      };
    }
  },

  /**
   * ✅ NEW: Translate text (For ChatRoom)
   */
  async translateText(text: string) {
    if (!isGeminiAvailable()) return text; // Fallback to original
    
    const client = getGeminiClient();
    const prompt = `Translate the following text to English (if it is Georgian) or to Georgian (if it is English). Keep it natural and slang-aware for drone pilots: "${text}"`;

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      return response.text || text;
    } catch (error) {
      console.error("Translation failed", error);
      return text;
    }
  },

  /**
   * ✅ NEW: Check Restricted Zone by Name (For RegulationsWiki)
   */
  async checkRestrictedZone(query: string) {
    if (!isGeminiAvailable()) return { status: 'UNKNOWN', message: 'API Unavailable' };

    const client = getGeminiClient();
    const prompt = `
      I am a drone pilot in Georgia. User asks about: "${query}".
      Is this location restricted for drones?
      
      Return JSON:
      {
        "status": "RESTRICTED" | "CAUTION" | "CLEAR",
        "message": "Explanation in Georgian (max 20 words)"
      }
    `;

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["RESTRICTED", "CLEAR", "CAUTION"] },
              message: { type: Type.STRING }
            },
            required: ['status', 'message']
          }
        }
      });

      const jsonStr = response.text || '{}';
      return JSON.parse(jsonStr);
    } catch (error) {
      return { status: 'CAUTION', message: 'ვერ მოხერხდა შემოწმება.' };
    }
  }
};