import { createContext, useContext } from 'react';
import type { Language } from '../utils/translations';

/** Values substituted into a translated string's `{placeholder}` slots. */
export type TranslationVars = Record<string, string | number>;

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  /**
   * Look up `key` in the active language, substituting any `vars`.
   *
   * Returns the key itself when it is missing, which makes an untranslated
   * string visible in the UI rather than rendering as a blank.
   */
  t: (key: string, vars?: TranslationVars) => string;
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
