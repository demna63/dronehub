import React, { useEffect, useMemo, useState } from 'react';
import MarketplaceCard from './MarketplaceCard';
import MarketplaceFilters from './MarketplaceFilters';
import MarketplaceEmptyState from './MarketplaceEmptyState';
import { User } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import { useMarketItems } from '../hooks/useMarketItems';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

interface MarketplaceListProps {
  currentUser?: User | null;
  onLoginRequest?: () => void;
}

/**
 * The marketplace owns its query.
 *
 * It used to filter the app's shared feed array, which meant it showed only the
 * listings that happened to be among the newest 50 posts site-wide — and once
 * the feed was paged, only those inside one 12-post page.
 */
const MarketplaceList: React.FC<MarketplaceListProps> = () => {
  const { items: marketItems, isLoading, isLoadingMore, hasMore, error, loadMore, retry } = useMarketItems();
  const { categoryId } = useParams<{ categoryId: string }>();
  // The /market/category/:id route existed but its param was never read, so the
  // filter always started at "all" no matter which link brought you here.
  const [activeFilter, setActiveFilter] = useState(categoryId ?? 'all');
  const navigate = useNavigate();

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

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-wider">მარკეტი</h1>
      </div>

      <MarketplaceFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {error && (
        <div className="mb-6 text-center py-10 border-2 border-dashed border-rose-500/20 rounded-3xl">
          <p className="text-sm text-rose-400 font-bold mb-4">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-colors"
          >
            ხელახლა ცდა
          </button>
        </div>
      )}

      {/* Items Grid */}
      {isLoading && marketItems.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-56 rounded-2xl bg-slate-900 border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <MarketplaceCard 
              key={item.id} 
              item={item} 
              onClick={() => navigate(`/post/${item.id}`)} 
            />
          ))}
        </div>
      ) : !error ? (
        <MarketplaceEmptyState activeFilter={activeFilter} onResetFilter={() => setActiveFilter('all')} />
      ) : null}

      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

      {hasMore && (
        <div className="pt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? 'იტვირთება…' : 'მეტის ჩვენება'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketplaceList;