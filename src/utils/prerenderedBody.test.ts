// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { capturePrerenderedBody, prerenderedBodyFor } from './prerenderedBody';

const setUp = (path: string, canonical: string | null, body: string): HTMLElement => {
  window.history.replaceState(null, '', path);
  document.head.innerHTML = canonical ? `<link rel="canonical" href="${canonical}" />` : '';
  document.body.innerHTML = `<div id="root">${body}</div>`;
  return document.getElementById('root') as HTMLElement;
};

describe('prerendered post body', () => {
  beforeEach(() => {
    capturePrerenderedBody(setUp('/', null, ''));
  });

  it('keeps the markup of the page it was written for', () => {
    capturePrerenderedBody(setUp('/post/abc', 'https://dronehub.ge/post/abc', '<main><h1>A</h1></main>'));
    expect(prerenderedBodyFor('/post/abc')).toBe('<main><h1>A</h1></main>');
  });

  it('never serves it for another post after client-side navigation', () => {
    capturePrerenderedBody(setUp('/post/abc', 'https://dronehub.ge/post/abc', '<main><h1>A</h1></main>'));
    expect(prerenderedBodyFor('/post/def')).toBeNull();
  });

  it('ignores the home body in a shell served for a post URL', () => {
    capturePrerenderedBody(setUp('/post/abc', 'https://dronehub.ge/', '<main><h1>Home</h1></main>'));
    expect(prerenderedBodyFor('/post/abc')).toBeNull();
  });

  it('ignores a shell with no canonical', () => {
    capturePrerenderedBody(setUp('/post/abc', null, '<main><h1>A</h1></main>'));
    expect(prerenderedBodyFor('/post/abc')).toBeNull();
  });
});
