import React, { useEffect, useMemo, useState } from 'react';
import MarketplaceCard from './MarketplaceCard';
import MarketplaceFilters from './MarketplaceFilters';
import MarketplaceEmptyState from './MarketplaceEmptyState';
import { Post, User } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import { isMarketItem } from '../constants/market';

interface MarketplaceListProps {
  posts: Post[];
  currentUser?: User | null;
  isFetching?: boolean;
  onLoginRequest?: () => void;
}

const MarketplaceList: React.FC<MarketplaceListProps> = ({ posts, isFetching = false }) => {
  const { categoryId } = useParams<{ categoryId: string }>();
  // The /market/category/:id route existed but its param was never read, so the
  // filter always started at "all" no matter which link brought you here.
  const [activeFilter, setActiveFilter] = useState(categoryId ?? 'all');
  const navigate = useNavigate();

  useEffect(() => { setActiveFilter(categoryId ?? 'all'); }, [categoryId]);

  const marketItems = useMemo(
    () => posts.filter((post) => isMarketItem(post.category)),
    [posts],
  );

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

      {/* Items Grid */}
      {isFetching && marketItems.length === 0 ? (
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
      ) : (
        <MarketplaceEmptyState activeFilter={activeFilter} onResetFilter={() => setActiveFilter('all')} />
      )}
    </div>
  );
};

export default MarketplaceList;