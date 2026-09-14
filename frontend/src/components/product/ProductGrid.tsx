import React from 'react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onCustomizeClick?: (product: Product) => void;
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onCustomizeClick,
  className = '',
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-cream-50/50 rounded-luxury-lg border border-cream-200">
        <p className="font-serif text-xl text-espresso-900 mb-1">
          No matching creations found.
        </p>
        <p className="text-xs text-espresso-600">
          Please adjust your search or selected filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5 lg:gap-6 ${className}`}
    >
      {products.map((product, idx) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={idx < 4}
          onCustomizeClick={onCustomizeClick}
        />
      ))}
    </div>
  );
};
