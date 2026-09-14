import { describe, expect, it } from 'vitest';
import { serverTimestamp, increment, Timestamp } from 'firebase/firestore';
import { sanitizeFirestoreData } from './firestoreRepository';

/**
 * The regression these cover shipped silently.
 *
 * The sanitizer used to recurse into every object, so `serverTimestamp()` — a
 * `FieldValue` instance — was rebuilt as a plain `{ _methodName: … }` and
 * written to Firestore as an ordinary map. Posts created that way have a
 * `createdAt` that is not a date: they read as "just now" forever, and because
 * Firestore sorts a map after a timestamp they sit permanently at the top of a
 * `createdAt desc` feed.
 */
describe('sanitizeFirestoreData', () => {
  it('passes a serverTimestamp sentinel through untouched', () => {
    const sentinel = serverTimestamp();
    const result = sanitizeFirestoreData({ createdAt: sentinel });
    // Identity, not shape: a copy is exactly what broke it.
    expect(result.createdAt).toBe(sentinel);
  });

  it('does not turn a sentinel into a plain object', () => {
    const result = sanitizeFirestoreData({ createdAt: serverTimestamp() }) as Record<string, unknown>;
    // The prototype is what the SDK checks. A JSON round-trip flattens a real
    // sentinel to the same shape, so only this distinguishes the two.
    expect(Object.getPrototypeOf(result.createdAt)).not.toBe(Object.prototype);
    expect(Object.getPrototypeOf(result.createdAt)).toBe(
      Object.getPrototypeOf(serverTimestamp()),
    );
  });

  it('preserves increment() and Timestamp instances', () => {
    const delta = increment(1);
    const stamp = Timestamp.fromDate(new Date('2026-01-01T00:00:00Z'));
    const result = sanitizeFirestoreData({ views: delta, at: stamp });
    expect(result.views).toBe(delta);
    expect(result.at).toBe(stamp);
  });

  it('preserves a Date', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    expect(sanitizeFirestoreData({ date }).date).toBe(date);
  });

  it('still strips undefined from plain objects, at any depth', () => {
    const result = sanitizeFirestoreData({
      keep: 'yes',
      drop: undefined,
      nested: { keep: 1, drop: undefined },
    });
    expect(result).toEqual({ keep: 'yes', nested: { keep: 1 } });
    expect('drop' in result).toBe(false);
    expect('drop' in (result.nested as object)).toBe(false);
  });

  it('strips undefined from arrays without collapsing them', () => {
    const result = sanitizeFirestoreData({ tags: ['a', undefined, 'b'] });
    expect(result.tags).toEqual(['a', 'b']);
  });

  it('keeps null, which Firestore accepts', () => {
    expect(sanitizeFirestoreData({ image: null }).image).toBeNull();
  });
});
