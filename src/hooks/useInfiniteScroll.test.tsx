// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useInfiniteScroll } from './useInfiniteScroll';

/** Minimal IntersectionObserver stand-in; jsdom does not implement one. */
class FakeObserver {
  static instances: FakeObserver[] = [];
  observed: Element[] = [];
  disconnected = false;

  constructor(private callback: IntersectionObserverCallback) {
    FakeObserver.instances.push(this);
  }

  observe(element: Element) { this.observed.push(element); }
  disconnect() { this.disconnected = true; }
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }

  /** Drive the callback as the browser would when the sentinel scrolls in. */
  trigger(isIntersecting = true) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

const Host: React.FC<{ hasMore: boolean; isLoading: boolean; onLoadMore: () => void }> = (props) => {
  const ref = useInfiniteScroll<HTMLDivElement>(props);
  return <div ref={ref} data-testid="sentinel" />;
};

beforeEach(() => {
  FakeObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useInfiniteScroll', () => {
  it('loads more when the sentinel comes into view', () => {
    const onLoadMore = vi.fn();
    render(<Host hasMore isLoading={false} onLoadMore={onLoadMore} />);

    FakeObserver.instances[0].trigger();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('ignores a non-intersecting entry', () => {
    const onLoadMore = vi.fn();
    render(<Host hasMore isLoading={false} onLoadMore={onLoadMore} />);

    FakeObserver.instances[0].trigger(false);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not observe while a page is already loading', () => {
    const onLoadMore = vi.fn();
    render(<Host hasMore isLoading onLoadMore={onLoadMore} />);
    // No observer at all, so a sentinel that is already on screen cannot queue
    // a second request behind the one in flight.
    expect(FakeObserver.instances).toHaveLength(0);
  });

  it('does not observe once the end is reached', () => {
    render(<Host hasMore={false} isLoading={false} onLoadMore={() => {}} />);
    expect(FakeObserver.instances).toHaveLength(0);
  });

  it('keeps one observer across re-renders with an inline callback', () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<Host hasMore isLoading={false} onLoadMore={() => onLoadMore()} />);
    rerender(<Host hasMore isLoading={false} onLoadMore={() => onLoadMore()} />);
    rerender(<Host hasMore isLoading={false} onLoadMore={() => onLoadMore()} />);

    // A new observer per render would re-fire against an element already in
    // view, requesting the same page several times.
    expect(FakeObserver.instances).toHaveLength(1);
  });

  it('calls the latest callback, not the one captured at observe time', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Host hasMore isLoading={false} onLoadMore={first} />);
    rerender(<Host hasMore isLoading={false} onLoadMore={second} />);

    FakeObserver.instances[0].trigger();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('disconnects on unmount', () => {
    const { unmount } = render(<Host hasMore isLoading={false} onLoadMore={() => {}} />);
    const observer = FakeObserver.instances[0];
    unmount();
    expect(observer.disconnected).toBe(true);
  });

  it('renders without an IntersectionObserver at all', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    expect(() => render(<Host hasMore isLoading={false} onLoadMore={() => {}} />)).not.toThrow();
  });
});
