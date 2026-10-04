import { describe, expect, it } from 'vitest';
import { normalizeSocialUrl } from './socialUrl';

describe('normalizeSocialUrl', () => {
  it('accepts http(s) addresses and adds https when the scheme is missing', () => {
    expect(normalizeSocialUrl('https://dronehub.ge/u/1')).toBe('https://dronehub.ge/u/1');
    expect(normalizeSocialUrl('instagram.com/dronehub')).toBe('https://instagram.com/dronehub');
  });

  it('rejects empty values, words, and non-http schemes', () => {
    expect(normalizeSocialUrl('')).toBeNull();
    expect(normalizeSocialUrl('   ')).toBeNull();
    expect(normalizeSocialUrl('not a url')).toBeNull();
    expect(normalizeSocialUrl('javascript:alert(1)')).toBeNull();
  });
});
