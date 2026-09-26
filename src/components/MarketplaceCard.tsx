import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../types';
import { useLanguage } from '../contexts/useLanguage';
import { PostTime } from './PostTime';

interface MarketplaceCardProps {
  item: Post;
}

const CONDITION_KEYS: Readonly<Record<string, string>> = {
  new: 'condition_new',
  used: 'condition_used',
  damaged: 'condition_damaged',
};

/**
 * A market listing (F18).
 *
 * The price is the card's headline in ink — not green, not monospace: green is
 * reserved for flight status. The condition is a neutral outline chip for the
 * same reason. Hover changes the border only; no lift, no image zoom (F12).
 */
const MarketplaceCard: React.FC<MarketplaceCardProps> = ({ item }) => {
  const { t } = useLanguage();
  const priceDisplay = item.price ? `${item.price} ₾` : t('price_negotiable');
  const conditionKey = item.condition ? CONDITION_KEYS[item.condition] : undefined;

  return (
    <Link
      to={`/post/${item.id}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-150 hover:border-white/[0.14]"
    >
      <div className="aspect-[4/3] bg-surface-2">
        {item.image && (
          <img src={item.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <span className="text-lg font-extrabold text-ink">{priceDisplay}</span>
        <h2 className="line-clamp-2 text-sm leading-[1.4] text-[#e2e8f0]">{item.title}</h2>
        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-ink-3">
          <span className="flex min-w-0 items-center gap-1">
            <span className="truncate">{item.location || t('location_default')}</span>
            <span aria-hidden="true">·</span>
            <PostTime value={item.createdAt} withIcon={false} className="shrink-0" />
          </span>
          <span className="shrink-0 rounded-md border border-white/[0.14] px-2 py-0.5 text-ink-2">
            {t(conditionKey ?? 'condition_unknown')}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MarketplaceCard;
