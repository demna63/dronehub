// runtime: Node.js 22
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const getModel = (apiKey) => {
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: 'gemini-3.6-flash' });
};

const parseJson = (text, fallback) => {
  try {
    return JSON.parse(text || '{}');
  } catch {
    return fallback;
  }
};

exports.geminiProxy = onCall(
  {
    secrets: [geminiApiKey],
    region: 'us-central1',
    cors: true,
  },
  async (request) => {
    const { action, payload = {} } = request.data || {};
    if (!action) {
      throw new HttpsError('invalid-argument', 'Missing action.');
    }

    const publicActions = new Set(['checkZoneWithAI', 'checkRestrictedZone']);
    if (!publicActions.has(action) && !request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const model = getModel(geminiApiKey.value());

    switch (action) {
      case 'analyzePost': {
        const { title = '', content = '' } = payload;
        const prompt = `Analyze this drone community post.\nTitle: "${title}"\nContent: "${content}"\nReturn JSON with suggestedCategory, suggestedSubCategory, tags (max 5), summary in Georgian (max 100 chars).`;
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });
        return { result: parseJson(response.response.text(), { suggestedCategory: 'general', suggestedSubCategory: '', tags: [], summary: '' }) };
      }

      case 'checkZoneWithAI': {
        const { lat, lng } = payload;
        const prompt = `I am a drone pilot in Georgia. Coordinates: ${lat}, ${lng}. Return JSON: {"status":"RESTRICTED"|"CAUTION"|"CLEAR","message":"Georgian max 20 words"}`;
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });
        return { result: parseJson(response.response.text(), { status: 'CAUTION', message: 'ვერ მოხერხდა შემოწმება.' }) };
      }

      case 'translateText': {
        const { text = '' } = payload;
        const prompt = `Translate to English (if Georgian) or Georgian (if English), drone pilot slang ok: "${text}"`;
        const response = await model.generateContent(prompt);
        return { result: response.response.text() || text };
      }

      case 'checkRestrictedZone': {
        const { query = '' } = payload;
        const prompt = `Drone pilot in Georgia asks about: "${query}". Return JSON status RESTRICTED|CAUTION|CLEAR and Georgian message max 20 words.`;
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });
        return { result: parseJson(response.response.text(), { status: 'CAUTION', message: 'ვერ მოხერხდა შემოწმება.' }) };
      }

      default:
        throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
    }
  }
);
