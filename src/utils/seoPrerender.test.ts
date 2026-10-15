import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderAppShell, renderHead, sitemapPaths } from '../../build/seoPrerender';

/**
 * Runs against the real `index.html`: if a head tag the prerender rewrites is
 * removed or duplicated there, this fails before a deploy ships pages that all
 * claim the homepage as canonical again.
 */
const template = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');

const head = {
  title: 'A "quoted" <title> & $& | DroneHub Georgia',
  description: 'Line <b>one</b>',
  canonical: 'https://dronehub.ge/post/abc',
  type: 'article' as const,
  image: null,
};

describe('renderHead', () => {
  const html = renderHead(template, head);

  it('rewrites the canonical and og:url to the page', () => {
    expect(html).toContain('<link rel="canonical" href="https://dronehub.ge/post/abc" />');
    expect(html).toContain('<meta property="og:url" content="https://dronehub.ge/post/abc" />');
    expect(html).not.toContain('href="https://dronehub.ge/"');
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
  });

  it('escapes text and keeps replacement patterns literal', () => {
    expect(html).toContain('<title>A &quot;quoted&quot; &lt;title&gt; &amp; $&amp; | DroneHub Georgia</title>');
    expect(html).toContain('content="Line &lt;b&gt;one&lt;/b&gt;"');
  });

  it('marks posts as articles', () => {
    expect(html).toContain('<meta property="og:type" content="article" />');
  });

  it('swaps the share image and drops the default card dimensions', () => {
    const withImage = renderHead(template, { ...head, image: 'https://img.example/p.webp' });
    expect(withImage).toContain('<meta property="og:image" content="https://img.example/p.webp" />');
    expect(withImage).toContain('<meta name="twitter:image" content="https://img.example/p.webp" />');
    expect(withImage).not.toContain('og:image:width');
    expect(html).toContain('og:image:width');
  });
});

describe('renderAppShell', () => {
  it('removes the canonical and nothing else', () => {
    const shell = renderAppShell(template);
    expect(shell).not.toContain('rel="canonical"');
    expect(shell).toContain('<meta name="robots" content="index, follow" />');
    expect(template.length - shell.length).toBeLessThan(80);
  });
});

describe('sitemapPaths', () => {
  it('extracts unique same-origin paths', () => {
    const xml =
      '<urlset><url><loc>https://dronehub.ge/</loc></url><url><loc>https://dronehub.ge/post/a</loc></url>' +
      '<url><loc>https://dronehub.ge/post/a</loc></url><url><loc>https://other.example/x</loc></url></urlset>';
    expect(sitemapPaths(xml)).toEqual(['/', '/post/a']);
  });
});
