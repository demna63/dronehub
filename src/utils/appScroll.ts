/**
 * The page's scroll container.
 *
 * From `md` up the layout is a fixed-height shell: the navbar and both sidebars
 * stay put and only the centre column scrolls, so a reader never loses the
 * navigation while moving through the feed. Below `md` the sidebars are hidden
 * and the document scrolls normally — a fixed-height shell on a phone stops the
 * browser's address bar from collapsing, which costs more screen than it saves.
 *
 * Two scrollers therefore exist depending on viewport width, and anything that
 * reads or moves the scroll position has to address whichever is live. These
 * helpers are that one place.
 *
 * The container is found by id rather than passed as a ref because its readers
 * are not its descendants: the navbar is a sibling, and SinglePostPage sits
 * several routes deep. Threading a ref to both would mean a context provider
 * above the whole tree for one DOM node.
 */
export const APP_SCROLL_ID = 'main';

const getContainer = (): HTMLElement | null =>
  typeof document === 'undefined' ? null : document.getElementById(APP_SCROLL_ID);

/** True when the centre column is the scroller, rather than the document. */
const containerScrolls = (element: HTMLElement | null): element is HTMLElement =>
  Boolean(element) && element!.scrollHeight > element!.clientHeight;

/** Current offset of whichever scroller is live. */
export const getAppScrollTop = (): number => {
  const container = getContainer();
  if (containerScrolls(container)) return container.scrollTop;
  return typeof window === 'undefined' ? 0 : window.scrollY;
};

/**
 * The element an IntersectionObserver should use as its root, or null for the
 * viewport.
 *
 * This matters more than it looks. A target inside an `overflow-y-auto` box is
 * clipped by that box, so once it scrolls out of view its intersection rect is
 * empty no matter how large a `rootMargin` the observer sets against the
 * viewport. Observing with the container as root is what keeps a "load 600px
 * early" margin meaning anything at all.
 */
export const getAppScrollRoot = (): HTMLElement | null => {
  const container = getContainer();
  return containerScrolls(container) ? container : null;
};

/** Back to the top — used on navigation, where landing mid-page is disorienting. */
export const scrollAppToTop = (): void => {
  const container = getContainer();
  if (container) container.scrollTop = 0;
  if (typeof window !== 'undefined') window.scrollTo(0, 0);
};

/**
 * Subscribe to scrolling on both candidates and return an unsubscribe.
 *
 * Both are listened to rather than one chosen at subscribe time: a resize can
 * cross the `md` breakpoint and hand the scrolling over to the other element
 * without anything re-subscribing.
 */
export const subscribeToAppScroll = (onScroll: () => void): (() => void) => {
  const container = getContainer();
  container?.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    container?.removeEventListener('scroll', onScroll);
    window.removeEventListener('scroll', onScroll);
  };
};
