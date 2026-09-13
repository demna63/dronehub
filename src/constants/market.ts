/**
 * The single literal for a marketplace listing's `category` field.
 *
 * `apiService.createMarketItem` has always written 'marketplace', but three
 * readers looked for 'market' instead and only worked by accident, via a
 * `|| post.price` fallback — which is falsy for a free listing, so `price: 0`
 * items were mis-shelved as ordinary posts. One exported constant, imported by
 * every reader and the writer, removes the class of bug rather than the
 * instance.
 *
 * The value matches what is already stored in Firestore; changing it would
 * orphan every existing listing.
 */
export const MARKET_CATEGORY = 'marketplace';

/** True for a post that is a marketplace listing. */
export const isMarketItem = (category?: string | null): boolean =>
  category === MARKET_CATEGORY;
