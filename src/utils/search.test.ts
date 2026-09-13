import { describe, expect, it } from 'vitest';
import { scorePost, searchPosts, tokenizeQuery } from './search';
import type { Post } from '../types';

const post = (fields: Partial<Post>): Post => ({
  id: Math.random().toString(36).slice(2),
  author: 'Dimitri',
  authorId: 'u1',
  authorReputation: 0,
  avatar: '',
  title: '',
  content: '',
  category: '',
  tags: [],
  timestamp: '',
  commentsCount: 0,
  ...fields,
} as Post);

describe('tokenizeQuery', () => {
  it('splits on whitespace and drops blanks', () => {
    expect(tokenizeQuery('  fpv   camera \n')).toEqual(['fpv', 'camera']);
    expect(tokenizeQuery('   ')).toEqual([]);
  });
});

describe('scorePost', () => {
  it('requires every token — two words narrow, not widen', () => {
    const target = post({ title: 'FPV camera review', content: 'about cameras' });
    expect(scorePost(target, tokenizeQuery('fpv camera'))).toBeGreaterThan(0);
    expect(scorePost(target, tokenizeQuery('fpv antenna'))).toBe(0);
  });

  it('ranks a title hit above a body-only hit', () => {
    const inTitle = post({ title: 'კამერები', content: '' });
    const inBody = post({ title: 'სხვა თემა', content: 'აქ ვწერ კამერები-ზე' });
    const tokens = tokenizeQuery('კამერები');
    expect(scorePost(inTitle, tokens)).toBeGreaterThan(scorePost(inBody, tokens));
  });

  it('matches tags, category and brand', () => {
    const tagged = post({ tags: ['FPV'], category: 'news', brand: 'Betaflight' });
    expect(scorePost(tagged, tokenizeQuery('betaflight'))).toBeGreaterThan(0);
    expect(scorePost(tagged, tokenizeQuery('news'))).toBeGreaterThan(0);
  });

  it('is case-insensitive for Latin text', () => {
    const target = post({ title: 'Betaflight 4.5' });
    expect(scorePost(target, tokenizeQuery('BETAFLIGHT'))).toBeGreaterThan(0);
  });

  it('survives legacy documents with missing fields', () => {
    // The old implementation called post.title.toLowerCase() straight out and
    // one such document threw, wiping out the whole result set.
    const legacy = { id: 'x' } as unknown as Post;
    expect(() => scorePost(legacy, tokenizeQuery('anything'))).not.toThrow();
    expect(scorePost(legacy, tokenizeQuery('anything'))).toBe(0);
  });

  it('scores nothing for an empty query', () => {
    expect(scorePost(post({ title: 'anything' }), [])).toBe(0);
  });
});

describe('searchPosts', () => {
  it('returns matches ordered by relevance', () => {
    const results = searchPosts([
      post({ id: 'body', title: 'ღამის ფრენა', content: 'კამერები კარგია' }),
      post({ id: 'title', title: 'კამერები FPV-სთვის' }),
    ], 'კამერები');

    expect(results.map((r) => r.id)).toEqual(['title', 'body']);
  });

  it('returns nothing for a blank query rather than everything', () => {
    expect(searchPosts([post({ title: 'a' })], '   ')).toEqual([]);
  });

  it('does not throw on a corpus containing broken documents', () => {
    const corpus = [{ id: 'broken' } as unknown as Post, post({ title: 'კამერები' })];
    expect(searchPosts(corpus, 'კამერები')).toHaveLength(1);
  });
});
