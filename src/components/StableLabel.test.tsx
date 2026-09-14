// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { StableLabel } from './StableLabel';
import { LanguageProvider } from '../contexts/LanguageContext';
import { useLanguage } from '../contexts/useLanguage';
import { translations } from '../utils/translations';

afterEach(() => {
  cleanup();
  try { window.localStorage.clear(); } catch { /* storage blocked */ }
});

const Toggle: React.FC = () => {
  const { toggleLanguage } = useLanguage();
  return <button onClick={toggleLanguage}>switch</button>;
};

const renderLabel = (tKey: string, vars?: Record<string, string | number>) =>
  render(
    <LanguageProvider>
      <StableLabel tKey={tKey} vars={vars} />
      <Toggle />
    </LanguageProvider>,
  );

describe('StableLabel', () => {
  it('renders every language, with only the active one visible', () => {
    const { container } = renderLabel('route_home');
    const variants = container.querySelectorAll('span > span');

    expect(variants).toHaveLength(Object.keys(translations).length);
    // The hidden variants are what reserve the width; they must still be in the
    // DOM and occupying their grid cell, not removed.
    const hidden = [...variants].filter((el) => el.className.includes('invisible'));
    expect(hidden).toHaveLength(Object.keys(translations).length - 1);
    expect(hidden[0].textContent).toBe(translations.en.route_home);
  });

  it('stacks every variant in the same grid cell', () => {
    const { container } = renderLabel('route_home');
    for (const el of container.querySelectorAll('span > span')) {
      expect(el.className).toContain('col-start-1');
      expect(el.className).toContain('row-start-1');
    }
  });

  it('swaps which variant is visible when the language changes', async () => {
    const user = userEvent.setup();
    const { container } = renderLabel('route_home');
    const visible = () =>
      [...container.querySelectorAll('span > span')]
        .filter((el) => !el.className.includes('invisible'))
        .map((el) => el.textContent);

    expect(visible()).toEqual([translations.ka.route_home]);
    await user.click(screen.getByRole('button', { name: 'switch' }));
    expect(visible()).toEqual([translations.en.route_home]);
  });

  it('interpolates vars into every variant, not only the visible one', () => {
    const { container } = renderLabel('rating_count', { count: 7 });
    for (const el of container.querySelectorAll('span > span')) {
      // A hidden variant left as a raw "{count}" would reserve the wrong width.
      expect(el.textContent).not.toContain('{count}');
      expect(el.textContent).toContain('7');
    }
  });

  it('falls back to the key for every variant when it is unknown', () => {
    const { container } = renderLabel('definitely_not_a_key');
    for (const el of container.querySelectorAll('span > span')) {
      expect(el.textContent).toBe('definitely_not_a_key');
    }
  });
});
