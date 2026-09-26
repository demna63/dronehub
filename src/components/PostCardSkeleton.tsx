import React from 'react';

/**
 * Placeholder for one compact post row while the feed loads.
 * Static on purpose: no pulse (F12). `rows` renders several inside one list.
 */
const PostCardSkeleton: React.FC<{ rows?: number }> = ({ rows = 1 }) => (
  <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-line bg-surface">
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="flex gap-4 border-t border-line px-4 py-4 first:border-t-0 sm:px-[18px]">
        <div className="flex flex-1 flex-col gap-2.5">
          <div className="h-3 w-40 rounded bg-surface-2" />
          <div className="h-4 w-3/4 rounded bg-surface-2" />
          <div className="h-3 w-52 rounded bg-surface-2" />
        </div>
        <div className="h-16 w-[84px] shrink-0 rounded-[10px] bg-surface-2 sm:h-[88px] sm:w-[120px]" />
      </div>
    ))}
  </div>
);

export default PostCardSkeleton;
