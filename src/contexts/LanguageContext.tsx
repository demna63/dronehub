import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translations, type Language } from '../utils/translations';
import { LanguageContext } from './useLanguage';

const STORAGE_KEY = 'dhg_language';

const isLanguage = (value: unknown): value is Language => value === 'ka' || value === 'en';

/**
 * The stored choice, or Georgian.
 *
 * localStorage throws outright in some privacy configurations, so the read is
 * guarded — a browser that blocks site data should fall back to the default,
 * not fail to render the app.
 */
const readStoredLanguage = (): Language => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(stored) ? stored : 'ka';
  } catch {
    return 'ka';
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Was `useState('ka')` with no persistence: every reload threw the choice
  // away and snapped back to Georgian.
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* storage blocked — the choice simply does not survive this session */
    }
    // index.html hardcodes lang="ka". Leaving it there while the UI is English
    // tells screen readers and translation tooling the wrong language.
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => setLanguageState(next), []);
  const toggleLanguage = useCallback(
    () => setLanguageState((prev) => (prev === 'ka' ? 'en' : 'ka')),
    [],
  );

  const t = useCallback((key: string): string => {
    const table = translations[language] as Record<string, string>;
    return table[key] ?? key;
  }, [language]);

  // Memoised: this provider wraps the entire app, so a fresh object here
  // invalidated every consumer on every render.
  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
