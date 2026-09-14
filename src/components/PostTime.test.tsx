// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PostTime } from './PostTime';
import { LanguageProvider } from '../contexts/LanguageContext';
import { useLanguage } from '../contexts/useLanguage';
import type { TimestampLike } from '../utils/dates';

const NOW = new Date('2026-09-14T12:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  try { window.localStorage.clear(); } catch { /* storage blocked */ }
});

const Toggle: React.FC = () => {
  const { toggleLanguage } = useLanguage();
  return <button onClick={toggleLanguage}>switch</button>;
};

const renderTime = (value: TimestampLike) =>
  render(
    <LanguageProvider>
      <PostTime value={value} />
      <Toggle />
    </LanguageProvider>,
  );

const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe('PostTime', () => {
  it('reports a three-day-old post as three days old, not as new', () => {
    // The bug this component exists to fix: PostCard rendered `post.timestamp`,
    // which nothing writes, so every post said "just now" regardless of age.
    const { container } = renderTime(daysAgo(3));
    expect(container.textContent).toMatch(/3/);
    expect(container.querySelector('time')).toHaveAttribute(
      'dateTime',
      daysAgo(3).toISOString(),
    );
  });

  it('renders nothing at all when the date is missing', () => {
    // Not "just now". A fabricated timestamp is the "Joined NaN" failure: it
    // does not look broken, so nobody reports it.
    const { container } = renderTime(null);
    expect(container.querySelector('time')).toBeNull();
  });

  it('renders nothing for an unparseable value', () => {
    const { container } = renderTime('not a date');
    expect(container.querySelector('time')).toBeNull();
  });

  it('accepts a Firestore timestamp that lost its toDate across JSON', () => {
    const { container } = renderTime({ seconds: Math.floor(daysAgo(2).getTime() / 1000), nanoseconds: 0 });
    expect(container.querySelector('time')).not.toBeNull();
    expect(container.textContent).toMatch(/2/);
  });

  it('follows the language', () => {
    const { container } = renderTime(daysAgo(3));
    const georgian = container.querySelector('time')?.textContent ?? '';

    // Fired directly rather than through userEvent: that helper waits on real
    // timers, which the fake clock in this suite never advances.
    act(() => {
      screen.getByRole('button', { name: 'switch' }).click();
    });
    const english = container.querySelector('time')?.textContent ?? '';

    expect(georgian).not.toBe(english);
    expect(english).toMatch(/days ago/);
  });
});
