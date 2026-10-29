import { describe, expect, it } from 'vitest';
import { interpolate, translations } from './translations';
import { SCAT_STL_CATALOG, localizeStlItem } from '../constants/stlCatalogData';

describe('interpolate', () => {
  it('substitutes named placeholders', () => {
    expect(interpolate('ნაპოვნია {count} შედეგი', { count: 5 })).toBe('ნაპოვნია 5 შედეგი');
  });

  it('substitutes the same placeholder more than once', () => {
    expect(interpolate('{name} → {name}', { name: 'DHG' })).toBe('DHG → DHG');
  });

  it('leaves an unknown placeholder visible', () => {
    // A typo must show up in the UI rather than rendering as a blank.
    expect(interpolate('{missing} ok', { other: 1 })).toBe('{missing} ok');
  });

  it('returns the template untouched when no vars are given', () => {
    expect(interpolate('{count}')).toBe('{count}');
  });

  it('accepts numbers and strings alike', () => {
    expect(interpolate('{a}/{b}', { a: 1, b: 'two' })).toBe('1/two');
  });
});

describe('translation tables', () => {
  const ka = Object.keys(translations.ka);
  const en = Object.keys(translations.en);

  it('defines the same keys in both languages', () => {
    expect([...ka].sort()).toEqual([...en].sort());
  });

  it('has no empty values', () => {
    for (const [key, value] of Object.entries(translations.ka)) {
      expect(value, `ka.${key}`).not.toBe('');
    }
    for (const [key, value] of Object.entries(translations.en)) {
      expect(value, `en.${key}`).not.toBe('');
    }
  });

  it('uses the same placeholders in both languages', () => {
    const slots = (value: string) => (value.match(/\{(\w+)\}/g) ?? []).sort();
    const enTable = translations.en as Record<string, string>;
    for (const [key, value] of Object.entries(translations.ka as Record<string, string>)) {
      // A placeholder present in one language and missing in the other renders
      // as a literal `{count}` for half the users.
      expect(slots(enTable[key] ?? ''), `placeholders differ for "${key}"`).toEqual(slots(value));
    }
  });

  it('localizes every STL catalog item cleanly into both Georgian and English', () => {
    const georgian = /[\u10A0-\u10FF]/;
    for (const item of SCAT_STL_CATALOG) {
      const enItem = localizeStlItem(item, 'en');
      expect(georgian.test(enItem.title), `en title for ${item.id}: ${enItem.title}`).toBe(false);
      expect(georgian.test(enItem.type), `en type for ${item.id}: ${enItem.type}`).toBe(false);
      expect(georgian.test(enItem.frame), `en frame for ${item.id}: ${enItem.frame}`).toBe(false);
      expect(georgian.test(enItem.description), `en description for ${item.id}: ${enItem.description}`).toBe(false);
      expect(georgian.test(enItem.supports ?? ''), `en supports for ${item.id}: ${enItem.supports}`).toBe(false);

      const kaItem = localizeStlItem(item, 'ka');
      expect(kaItem.title.length, `ka title for ${item.id}`).toBeGreaterThan(0);
      expect(georgian.test(kaItem.type), `ka type for ${item.id}: ${kaItem.type}`).toBe(true);
      expect(georgian.test(kaItem.description), `ka description for ${item.id}: ${kaItem.description}`).toBe(true);
    }
  });
});
