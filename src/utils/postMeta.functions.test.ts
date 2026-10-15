import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// CommonJS module from the Cloud Functions source; tested here because the
// functions package has no test runner of its own.
import postMeta from '../../functions/postMeta.js';
import { summarize as routeSummarize, pageTitle as routePageTitle } from './routeMeta';

const { POST_ID, renderPostShell, templateHost, summarize, pageTitle } = postMeta as {
  pageTitle: (title: string) => string;
  POST_ID: RegExp;
  renderPostShell: (template: string, postId: string, post: Record<string, unknown> | null) => string;
  templateHost: (forwardedHost: string | undefined) => string;
  summarize: (content: string) => string;
};

/** The real shell, so a change to index.html that breaks a pattern fails here. */
const template = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');

const meta = (html: string, key: string): string | null => {
  const match = html.match(new RegExp(`<meta\\s+(?:name|property)="${key}"\\s+content="([^"]*)"`));
  return match ? match[1] : null;
};

describe('renderPostShell', () => {
  const post = {
    title: 'ჩემი 5" freestyle build',
    content: 'Frame: 5" <b>bold</b>\n\nMotors: 2306 1950KV',
    image: 'https://firebasestorage.googleapis.com/v0/b/x/o/a.jpg?alt=media',
    imageWidth: 1600,
    imageHeight: 900,
  };

  it('writes the post into title, og, twitter and canonical', () => {
    const html = renderPostShell(template, 'abc123', post);

    expect(html).toContain('<title>ჩემი 5&quot; freestyle build | DroneHub Georgia</title>');
    expect(meta(html, 'og:title')).toBe('ჩემი 5&quot; freestyle build | DroneHub Georgia');
    expect(meta(html, 'twitter:title')).toBe('ჩემი 5&quot; freestyle build | DroneHub Georgia');
    expect(meta(html, 'og:type')).toBe('article');
    expect(meta(html, 'og:url')).toBe('https://dronehub.ge/post/abc123');
    expect(html).toContain('<link rel="canonical" href="https://dronehub.ge/post/abc123"');
    expect(meta(html, 'og:image')).toBe(post.image);
    expect(meta(html, 'og:image:width')).toBe('1600');
  });

  it('escapes post text so it cannot break out of an attribute', () => {
    const html = renderPostShell(template, 'abc123', {
      title: '"><script>alert(1)</script>',
      content: 'x',
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(meta(html, 'og:title')).toBe('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt; | DroneHub Georgia');
  });

  it('keeps the default card image for a post without an https image', () => {
    const html = renderPostShell(template, 'abc123', { title: 'T', content: 'c', image: 'data:image/png;base64,AAAA' });
    expect(meta(html, 'og:image')).toBe(meta(template, 'og:image'));
    expect(meta(html, 'og:image:width')).toBe('1200');
  });

  it('drops the default dimensions when the post image has none', () => {
    const html = renderPostShell(template, 'abc123', { title: 'T', content: 'c', image: 'https://x.test/a.jpg' });
    expect(meta(html, 'og:image:width')).toBeNull();
    expect(meta(html, 'og:image:height')).toBeNull();
  });

  it('marks a missing post noindex, drops the canonical, leaves the rest alone', () => {
    const html = renderPostShell(template, 'gone', null);
    expect(meta(html, 'robots')).toBe('noindex, follow');
    expect(html).not.toContain('rel="canonical"');
    expect(meta(html, 'og:title')).toBe(meta(template, 'og:title'));
  });

  it('touches nothing but <head>', () => {
    const html = renderPostShell(template, 'abc123', post);
    const body = (s: string) => s.slice(s.indexOf('<body'));
    expect(body(html)).toBe(body(template));
  });
});

describe('summarize', () => {
  it('agrees with routeMeta.summarize, so prerendered and function-served posts match', () => {
    const text = 'ქართული ტექსტი '.repeat(30);
    expect(summarize(text)).toBe(routeSummarize(text));
  });

  it('flattens whitespace and caps at 160 characters', () => {
    expect(summarize('a\n\n  b')).toBe('a b');
    const long = summarize('x'.repeat(400));
    expect(long).toHaveLength(160);
    expect(long.endsWith('…')).toBe(true);
  });
});

describe('templateHost', () => {
  it('accepts production and this project’s preview channels', () => {
    expect(templateHost('dronehub.ge')).toBe('dronehub.ge');
    expect(templateHost('www.dronehub.ge')).toBe('www.dronehub.ge');
    expect(templateHost('dronehubgeorgia-a7bd5--pr3-claude-x-f4jw.web.app')).toBe('dronehubgeorgia-a7bd5--pr3-claude-x-f4jw.web.app');
  });

  it('falls back to production for any other host', () => {
    expect(templateHost('evil.example')).toBe('dronehub.ge');
    expect(templateHost('dronehub.ge.evil.example')).toBe('dronehub.ge');
    expect(templateHost('other-project--pr1.web.app')).toBe('dronehub.ge');
    expect(templateHost(undefined)).toBe('dronehub.ge');
  });
});

describe('POST_ID', () => {
  it('accepts Firestore auto-ids only', () => {
    expect(POST_ID.test('XdBQWreoF1mWa7HvPjH9')).toBe(true);
    expect(POST_ID.test('../users')).toBe(false);
    expect(POST_ID.test('')).toBe(false);
  });
});

describe('pageTitle mirror', () => {
  it.each(['მოკლე', 'x'.repeat(41), 'x'.repeat(42), 'დრონების ინჟინერიის ყოველდღიური ტექნიკური დაიჯესტი'])(
    'matches routeMeta for %s',
    (title) => expect(pageTitle(title)).toBe(routePageTitle(title)),
  );

  it('names an untitled post after its body', () => {
    const html = renderPostShell(template, 'abc123', { title: '', content: 'FPV  დრონის აწყობა' });
    expect(html).toContain('<title>FPV დრონის აწყობა | DroneHub Georgia</title>');
  });
});
