import React, { useState } from 'react';
import MarketplaceCard from './MarketplaceCard';
import MarketplaceFilters from './MarketplaceFilters';
import MarketplaceEmptyState from './MarketplaceEmptyState';
import { Post, User } from '../types';
import { useNavigate } from 'react-router-dom';

interface MarketplaceListProps {
  posts?: Post[]; // 👈 ახლა იღებს posts, როგორც App.tsx აწვდის
  user?: User | null;
  [key: string]: any; // ვიზღვევთ თავს სხვა გაუთვალისწინებელი ერორებისგან
}

const MarketplaceList: React.FC<MarketplaceListProps> = ({ posts = [], user }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  // ვიღებთ მხოლოდ მარკეტის განცხადებებს
  const marketItems = posts.filter(post => post.category === 'market' || post.price !== undefined);

  // ვფილტრავთ კატეგორიების მიხედვით
  const filteredItems = marketItems.filter(item => {
    if (activeFilter === 'all') return true;
    return item.subCategory === activeFilter;
  });

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-wider">მარკეტი</h1>
      </div>

      <MarketplaceFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
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