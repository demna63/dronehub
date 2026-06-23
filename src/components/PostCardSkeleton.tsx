
import React from 'react';

const PostCardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900/20 border border-white/5 flex rounded-[28px] overflow-hidden animate-pulse backdrop-blur-sm h-[240px]">
      <div className="w-12 lg:w-14 bg-white/[0.01] flex flex-col items-center py-6 gap-4 border-r border-white/5">
        <div className="w-4 h-4 bg-white/5 rounded-lg"></div>
        <div className="w-3 h-2 bg-white/5 rounded"></div>
        <div className="w-4 h-4 bg-white/5 rounded-lg"></div>
      </div>
      <div className="flex-1 p-4 md:p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-xl bg-white/5"></div>
            <div className="w-24 h-2 bg-white/5 rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/5"></div>
            <div className="w-6 h-6 rounded-lg bg-white/5"></div>
          </div>
        </div>
        <div className="w-2/3 h-5 bg-white/5 rounded-lg"></div>
        <div className="flex-1 bg-white/[0.02] rounded-2xl"></div>
        <div className="flex justify-between mt-auto">
          <div className="flex gap-2">
            <div className="w-12 h-4 bg-white/5 rounded-lg"></div>
            <div className="w-12 h-4 bg-white/5 rounded-lg"></div>
          </div>
          <div className="w-16 h-4 bg-white/5 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default PostCardSkeleton;
