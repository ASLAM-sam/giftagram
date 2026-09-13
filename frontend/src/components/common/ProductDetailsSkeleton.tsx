import React from 'react';

export const ProductDetailsSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start animate-pulse">
        {/* Left: Gallery Skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-cream-200 rounded-luxury-lg w-full" />
          <div className="flex gap-3">
            <div className="w-20 h-20 bg-cream-200 rounded-lg" />
            <div className="w-20 h-20 bg-cream-200 rounded-lg" />
            <div className="w-20 h-20 bg-cream-200 rounded-lg" />
          </div>
        </div>

        {/* Right: Info Skeleton */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 bg-cream-100 rounded w-24" />
            <div className="h-8 bg-cream-200 rounded w-3/4" />
            <div className="h-6 bg-cream-200 rounded w-32 mt-2" />
          </div>

          <div className="space-y-2 pt-4 border-t border-cream-200">
            <div className="h-3.5 bg-cream-100 rounded w-full" />
            <div className="h-3.5 bg-cream-100 rounded w-5/6" />
            <div className="h-3.5 bg-cream-100 rounded w-4/6" />
          </div>

          <div className="p-4 bg-cream-100/70 rounded-luxury border border-cream-200 space-y-2">
            <div className="h-4 bg-cream-200 rounded w-48" />
            <div className="h-3 bg-cream-200 rounded w-64" />
          </div>

          <div className="pt-4 flex gap-4">
            <div className="h-12 bg-cream-200 rounded-full flex-1" />
            <div className="h-12 w-12 bg-cream-200 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
