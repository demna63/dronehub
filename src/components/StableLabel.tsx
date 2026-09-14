import React from 'react';
import { useLanguage } from '../contexts/useLanguage';
import { interpolate, translations, type Language } from '../utils/translations';

const LANGUAGES = Object.keys(translations) as Language[];

interface StableLabelProps {
  /** Translation key to render. */
  tKey: string;
  vars?: Record<string, string | number>;
  className?: string;
  /** Horizontal alignment of the visible text inside the reserved box. */
  align?: 'center' | 'start';
}

/**
 * A translated label in a box as wide as its WIDEST translation.
 *
 * Georgian and English words differ in length — "მთავარი" against "Home",
 * "ხელსაწყოები" against "Tools" — so every label in the navbar changed width on
 * a language switch, and because they sit in one flex row, each one moved all
 * the others. The bar visibly jumped.
 *
 * Every language is rendered into the same CSS grid cell; only the active one
 * is visible and the rest are `visibility: hidden`, which still occupies space
 * and is removed from the accessibility tree. The cell therefore takes the
 * width of the longest variant and does not change when the language does.
 *
 * The alternative — measuring text and writing a min-width — needs a number per
 * label, goes stale the moment a translation is edited, and cannot know the
 * user's font. This needs nothing but the strings that already exist.
 */
export const StableLabel: React.FC<StableLabelProps> = ({
  tKey,
  vars,
  className = '',
  align = 'center',
}) => {
  const { language, t } = useLanguage();
  const justify = align === 'center' ? 'justify-items-center' : 'justify-items-start';

  return (
    <span className={`grid ${justify} ${className}`}>
      {LANGUAGES.map((lang) => {
        const isActive = lang === language;
        const table = translations[lang] as Record<string, string>;
        return (
          <span
            key={lang}
            className={`col-start-1 row-start-1 whitespace-nowrap ${isActive ? '' : 'invisible'}`}
          >
            {/* The active variant goes through `t` so a missing key behaves
                exactly as it does everywhere else in the app. */}
            {isActive ? t(tKey, vars) : interpolate(table[tKey] ?? tKey, vars)}
          </span>
        );
      })}
    </span>
  );
};

export default StableLabel;
