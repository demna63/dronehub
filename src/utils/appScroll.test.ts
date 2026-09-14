// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  APP_SCROLL_ID,
  getAppScrollRoot,
  getAppScrollTop,
  scrollAppToTop,
  subscribeToAppScroll,
} from './appScroll';

/** A #main that reports itself as scrollable, which jsdom will not do on its own. */
const mountScroller = ({ scrollable }: { scrollable: boolean }) => {
  const element = document.createElement('main');
  element.id = APP_SCROLL_ID;
  Object.defineProperty(element, 'scrollHeight', { value: scrollable ? 2000 : 100, configurable: true });
  Object.defineProperty(element, 'clientHeight', { value: 100, configurable: true });
  document.body.appendChild(element);
  return element;
};

afterEach(() => {
  document.body.innerHTML = '';
  window.scrollTo(0, 0);
  vi.restoreAllMocks();
});

describe('appScroll', () => {
  it('reads the container offset when the container is the scroller', () => {
    const element = mountScroller({ scrollable: true });
    element.scrollTop = 250;
    expect(getAppScrollTop()).toBe(250);
  });

  it('falls back to the window when the container does not scroll', () => {
    mountScroller({ scrollable: false });
    Object.defineProperty(window, 'scrollY', { value: 80, configurable: true });
    // Below the md breakpoint the document is the scroller, and the navbar has
    // to keep reacting to it.
    expect(getAppScrollTop()).toBe(80);
  });

  it('reads the window when there is no container at all', () => {
    Object.defineProperty(window, 'scrollY', { value: 42, configurable: true });
    expect(getAppScrollTop()).toBe(42);
  });

  it('offers the container as an observer root only while it scrolls', () => {
    const element = mountScroller({ scrollable: true });
    expect(getAppScrollRoot()).toBe(element);

    document.body.innerHTML = '';
    mountScroller({ scrollable: false });
    // Null means "the viewport", which is correct when the document scrolls.
    expect(getAppScrollRoot()).toBeNull();
  });

  it('resets both scrollers, since either may be the live one', () => {
    const element = mountScroller({ scrollable: true });
    element.scrollTop = 500;
    const windowScroll = vi.spyOn(window, 'scrollTo');

    scrollAppToTop();

    expect(element.scrollTop).toBe(0);
    expect(windowScroll).toHaveBeenCalledWith(0, 0);
  });

  it('subscribes to both scrollers and unsubscribes from both', () => {
    const element = mountScroller({ scrollable: true });
    const onScroll = vi.fn();
    const unsubscribe = subscribeToAppScroll(onScroll);

    element.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    expect(onScroll).toHaveBeenCalledTimes(2);

    unsubscribe();
    element.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    expect(onScroll).toHaveBeenCalledTimes(2);
  });

  it('still subscribes to the window when the container is absent', () => {
    const onScroll = vi.fn();
    const unsubscribe = subscribeToAppScroll(onScroll);
    window.dispatchEvent(new Event('scroll'));
    expect(onScroll).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
