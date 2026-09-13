import { createContext, useContext } from 'react';
import type { Language } from '../utils/translations';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

/**
 * The context object and its hook live apart from `LanguageProvider` for the
 * same reason as the toast context: a module that exports both a component and
 * other values loses React Fast Refresh, so editing the provider reloads the
 * whole page instead of hot-swapping the module.
 */
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
