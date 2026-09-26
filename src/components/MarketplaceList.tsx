import React, { useEffect, useMemo, useState } from 'react';
import MarketplaceCard from './MarketplaceCard';
import MarketplaceFilters from './MarketplaceFilters';
import MarketplaceEmptyState from './MarketplaceEmptyState';
import PageHeader from './PageHeader';
import { User } from '../types';
import { useParams } from 'react-router-dom';
import { useMarketItems } from '../hooks/useMarketItems';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useLanguage } from '../contexts/useLanguage';

interface MarketplaceListProps {
  currentUser?: User | null;
  onLoginRequest?: () => void;
  /** Opens the new-listing dialog (App routes signed-out users to sign-in). */
  onCreateListing?: () => void;
}

/**
 * The marketplace owns its query.
 *
 * It used to filter the app's shared feed array, which meant it showed only the
 * listings that happened to be among the newest 50 posts site-wide — and once
 * the feed was paged, only those inside one 12-post page.
 */
const MarketplaceList: React.FC<MarketplaceListProps> = ({ onCreateListing }) => {
  const { t } = useLanguage();
  const { items: marketItems, isLoading, isLoadingMore, hasMore, error, loadMore, retry } = useMarketItems();
  const { categoryId } = useParams<{ categoryId: string }>();
  // The /market/category/:id route existed but its param was never read, so the
  // filter always started at "all" no matter which link brought you here.
  const [activeFilter, setActiveFilter] = useState(categoryId ?? 'all');

  useEffect(() => { setActiveFilter(categoryId ?? 'all'); }, [categoryId]);

  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    hasMore,
    isLoading: isLoading || isLoadingMore,
    onLoadMore: loadMore,
  });

  const filteredItems = useMemo(
    () => (activeFilter === 'all'
      ? marketItems
      : marketItems.filter((item) => item.subCategory === activeFilter)),
    [marketItems, activeFilter],
  );

  const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('route_market')}
        subtitle={t('market_subtitle')}
        action={onCreateListing && (
          <button
            type="button"
            onClick={onCreateListing}
            className="flex h-10 items-center rounded-[10px] bg-accent-fill px-4 text-sm font-bold text-white transition-colors duration-150 hover:bg-accent-fill-hover active:bg-accent-fill-active"
          >
            {t('market_add_listing')}
          </button>
        )}
      />

      <MarketplaceFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {error && (
        <div className="rounded-2xl border border-bad/30 bg-surface px-6 py-10 text-center">
          <p className="mb-4 text-sm font-bold text-bad">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="h-10 rounded-[10px] border border-white/10 px-[18px] text-sm font-bold text-ink-2 transition-colors hover:bg-white/5"
          >
            {t('action_retry')}
          </button>
        </div>
      )}

      {isLoading && marketItems.length === 0 ? (
        <div className={GRID} aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="aspect-[4/3] bg-surface-2" />
              <div className="flex flex-col gap-2 p-3.5">
                <div className="h-4 w-20 rounded bg-surface-2" />
                <div className="h-3 w-3/4 rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className={GRID}>
          {filteredItems.map((item) => (
            <MarketplaceCard key={item.id} item={item} />
          ))}
        </div>
      ) : !error ? (
        <MarketplaceEmptyState activeFilter={activeFilter} onResetFilter={() => setActiveFilter('all')} />
      ) : null}

      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={isLoadingMore}
          className="h-10 self-center rounded-[10px] border border-white/10 px-[18px] text-sm font-bold text-ink-2 transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          {isLoadingMore ? t('state_loading') : t('action_load_more')}
        </button>
      )}
    </div>
  );
};

export default MarketplaceList;