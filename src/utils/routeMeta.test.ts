import { describe, expect, it } from 'vitest';
import { canonicalPath, canonicalUrl, pageTitle, resolveRouteMeta, summarize, TITLE_MAX } from './routeMeta';

const t = (key: string) => `«${key}»`;

describe('canonicalPath', () => {
  it('keeps the root and strips trailing slashes elsewhere', () => {
    expect(canonicalPath('/')).toBe('/');
    expect(canonicalPath('')).toBe('/');
    expect(canonicalPath('/tools/')).toBe('/tools');
    expect(canonicalPath('/post/abc//')).toBe('/post/abc');
  });

  it('maps alias routes to the page they render', () => {
    expect(canonicalPath('/wiki')).toBe('/regulations');
    expect(canonicalPath('/marketplace/')).toBe('/market');
    expect(canonicalPath('/wiki/drone-law')).toBe('/wiki/drone-law');
  });

  it('builds absolute URLs on the apex host', () => {
    expect(canonicalUrl('/post/abc')).toBe('https://dronehub.ge/post/abc');
  });
});

describe('summarize', () => {
  it('collapses whitespace and leaves short text alone', () => {
    expect(summarize('  a \n\n b\t c ')).toBe('a b c');
  });

  it('cuts by code point, never splitting a surrogate pair', () => {
    const text = '🚁'.repeat(200);
    const out = summarize(text, 10);
    expect(Array.from(out)).toHaveLength(10);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });
});

describe('resolveRouteMeta', () => {
  it('resolves the home page', () => {
    expect(resolveRouteMeta('/', t)).toEqual({
      title: '«home_page_title»',
      description: '«meta_desc_default»',
      canonical: 'https://dronehub.ge/',
    });
  });

  it('gives every tool its own description', () => {
    expect(resolveRouteMeta('/tools/fpv-range', t).description).toBe('«meta_desc_range»');
    expect(resolveRouteMeta('/tools/fresnel', t)).toMatchObject({
      title: '«tool_title_fresnel» | DroneHub Georgia',
      description: '«meta_desc_fresnel»',
    });
    const tools = ['fpv-range', 'stl', 'battery-calc', 'channel-tuner', 'antenna-tuner', 'fresnel', 'unlocker', 'harmonics', 'zone-check', 'converter'];
    const descriptions = tools.map((tool) => resolveRouteMeta(`/tools/${tool}`, t).description);
    expect(new Set(descriptions).size).toBe(tools.length);
    expect(descriptions).not.toContain('«meta_desc_tools»');
  });

  it('falls back to the tools description for an unknown tool', () => {
    expect(resolveRouteMeta('/tools/unknown', t).description).toBe('«meta_desc_tools»');
  });

  it('uses an override title and summarizes an override description', () => {
    const meta = resolveRouteMeta('/post/abc', t, { title: 'Hello', description: 'x'.repeat(500) });
    expect(meta.title).toBe('Hello | DroneHub Georgia');
    expect(Array.from(meta.description)).toHaveLength(160);
    expect(meta.canonical).toBe('https://dronehub.ge/post/abc');
  });

  it('keeps curated route descriptions whole', () => {
    const long = (key: string) => (key === 'meta_desc_default' ? 'y'.repeat(300) : key);
    expect(resolveRouteMeta('/', long).description).toHaveLength(300);
  });
});

describe('post titles', () => {
  const t = (key: string) => key;

  it('names an untitled post after the start of its body, never "Post"', () => {
    const meta = resolveRouteMeta('/post/abc', t, { description: 'FPV  დრონის აწყობა\nნაბიჯ-ნაბიჯ' });
    expect(meta.title).toBe('FPV დრონის აწყობა ნაბიჯ-ნაბიჯ | DroneHub Georgia');
    expect(meta.title).not.toMatch(/^Post\b/);
  });

  it('drops the site suffix when the pair would exceed TITLE_MAX', () => {
    const long = 'დრონების ინჟინერიის ყოველდღიური ტექნიკური დაიჯესტი — ნომერი 12';
    expect(pageTitle(long)).toBe(long);
    expect(pageTitle('მოკლე სათაური')).toBe('მოკლე სათაური | DroneHub Georgia');
    expect(Array.from(pageTitle('x'.repeat(41))).length).toBeLessThanOrEqual(TITLE_MAX);
  });
});
