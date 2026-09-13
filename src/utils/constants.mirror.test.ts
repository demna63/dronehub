import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIN_VOTES_FOR_VERDICT, PRIOR_MEAN, PRIOR_WEIGHT, RATING_MAX, RATING_MIN } from './telemetry';
import { COMMENT_MAX_LENGTH, MESSAGE_MAX_LENGTH, POST_CONTENT_MAX_LENGTH, POST_TITLE_MAX_LENGTH } from '../constants/limits';

/**
 * Drift guards.
 *
 * Three numbers exist in two places each, by necessity: the Cloud Function is
 * CommonJS and deploys separately so it cannot import the TypeScript, and
 * firestore.rules is its own language. Both files carry a comment saying
 * "change one, change the other" — a comment nobody reads at 2am. These tests
 * fail the build instead.
 *
 * A mismatch is not cosmetic: the feed would be ranked by scores computed with
 * one set of constants and displayed with another, and a compose box would let
 * a user type past what the rules accept.
 */
const readRepoFile = (relative: string) =>
  readFileSync(resolve(__dirname, '../..', relative), 'utf8');

describe('telemetry constants mirror functions/index.js', () => {
  const source = readRepoFile('functions/index.js');

  const numberFor = (key: string): number => {
    const match = source.match(new RegExp(`${key}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`));
    expect(match, `${key} not found in functions/index.js`).not.toBeNull();
    return Number(match![1]);
  };

  it('keeps PRIOR_MEAN in sync', () => expect(numberFor('PRIOR_MEAN')).toBe(PRIOR_MEAN));
  it('keeps PRIOR_WEIGHT in sync', () => expect(numberFor('PRIOR_WEIGHT')).toBe(PRIOR_WEIGHT));
  it('does not expect MIN_VOTES_FOR_VERDICT on the server', () => {
    // The vote threshold is a display decision — the server always computes a
    // score, the client decides whether it is worth showing. Asserted here so
    // the asymmetry is deliberate rather than an oversight.
    expect(MIN_VOTES_FOR_VERDICT).toBeGreaterThan(0);
    expect(source).not.toContain('MIN_VOTES');
  });
  it('keeps the rating scale in sync', () => {
    expect(numberFor('MIN')).toBe(RATING_MIN);
    expect(numberFor('MAX')).toBe(RATING_MAX);
  });
});

describe('input limits mirror firestore.rules', () => {
  const rules = readRepoFile('firestore.rules');

  /** Every `withinSize('field', N)` cap declared in the rules. */
  const caps = new Map<string, number[]>();
  for (const [, field, size] of rules.matchAll(/withinSize\('(\w+)',\s*(\d+)\)/g)) {
    caps.set(field, [...(caps.get(field) ?? []), Number(size)]);
  }

  it('finds the caps it is meant to check', () => {
    expect(caps.has('text')).toBe(true);
    expect(caps.has('title')).toBe(true);
    expect(caps.has('content')).toBe(true);
  });

  it('never lets a compose box accept more than the rules allow', () => {
    for (const size of caps.get('text') ?? []) {
      expect(MESSAGE_MAX_LENGTH).toBeLessThanOrEqual(size);
      expect(COMMENT_MAX_LENGTH).toBeLessThanOrEqual(size);
    }
    for (const size of caps.get('title') ?? []) {
      expect(POST_TITLE_MAX_LENGTH).toBeLessThanOrEqual(size);
    }
    for (const size of caps.get('content') ?? []) {
      expect(POST_CONTENT_MAX_LENGTH).toBeLessThanOrEqual(size);
    }
  });
});
