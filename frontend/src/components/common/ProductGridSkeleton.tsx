import React from 'react';

interface ProductGridSkeletonProps {
  count?: number;
}

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#FFFDF9] rounded-luxury overflow-hidden border border-cream-200/80 p-0 animate-pulse flex flex-col"
        >
          {/* Image skeleton */}
          <div className="aspect-square bg-cream-200/70 w-full" />

          {/* Content skeleton */}
          <div className="p-2.5 sm:p-4 space-y-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="h-4 bg-cream-200 rounded w-3/4" />
              <div className="h-2.5 bg-cream-100 rounded w-full hidden sm:block" />
            </div>

            <div className="pt-2 sm:pt-3 border-t border-cream-200/60 flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-3.5 bg-cream-200 rounded w-12" />
                <div className="h-2 bg-cream-100 rounded w-16" />
              </div>
              <div className="h-6 sm:h-7 bg-cream-200/80 rounded-full w-14 sm:w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
