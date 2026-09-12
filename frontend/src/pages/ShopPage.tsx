import React, { useState, useMemo } from 'react';
import { ALL_PRODUCTS } from '../data/products';
import { ProductCard } from '../components/product/ProductCard';
import { CakeCustomizationModal } from '../components/cake/CakeCustomizationModal';
import { Product } from '../types';
import { SlidersHorizontal } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'cakes' | 'bouquets'>('all');
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [customizingCake, setCustomizingCake] = useState<Product | null>(null);

  const displayedProducts = useMemo(() => {
    let list = [...ALL_PRODUCTS];

    if (activeTab !== 'all') {
      list = list.filter((p) => p.category === activeTab);
    }

    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [activeTab, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="font-script text-4xl text-rose-500 block">
          The entire collection
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-espresso-900 font-medium tracking-tight">
          Shop All Creations
        </h1>
        <p className="text-sm sm:text-base text-espresso-700 font-light leading-relaxed">
          Explore our artisanal 500g cakes and romantic fresh rose bouquets.
        </p>
      </div>

      {/* Tabs and Sort */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-b border-cream-300 pb-5">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { id: 'all', label: 'All Products (15)' },
            { id: 'cakes', label: 'Cakes (9)' },
            { id: 'bouquets', label: 'Bouquets (6)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-rose-500 text-white shadow-soft'
                  : 'bg-cream-100 text-espresso-800 hover:bg-cream-200 border border-cream-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-espresso-700 w-full sm:w-auto justify-end">
          <SlidersHorizontal className="w-3.5 h-3.5 text-espresso-600" />
          <span className="font-medium">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="bg-white border border-cream-300 rounded-lg px-3 py-1.5 text-xs text-espresso-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
          >
            <option value="featured">Featured Collection</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
        {displayedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onCustomizeClick={(p) => setCustomizingCake(p)}
          />
        ))}
      </div>

      {/* Cake Customization Modal */}
      {customizingCake && (
        <CakeCustomizationModal
          isOpen={!!customizingCake}
          onClose={() => setCustomizingCake(null)}
          product={customizingCake}
        />
      )}
    </div>
  );
};
