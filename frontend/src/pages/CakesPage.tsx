import React, { useState, useMemo } from 'react';
import { CAKE_PRODUCTS } from '../data/cakes';
import { ProductCard } from '../components/product/ProductCard';
import { CakeCustomizationModal } from '../components/cake/CakeCustomizationModal';
import { Product } from '../types';
import { ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';

export const CakesPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'chocolate' | 'fruit' | 'premium'>('all');
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [customizingCake, setCustomizingCake] = useState<Product | null>(null);

  const filteredCakes = useMemo(() => {
    let list = [...CAKE_PRODUCTS];

    if (filter !== 'all') {
      list = list.filter((cake) => cake.flavorCategory === filter);
    }

    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [filter, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="font-script text-4xl text-rose-500 block">
          Freshly baked
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-espresso-900 font-medium tracking-tight">
          Cakes
        </h1>
        <p className="text-sm sm:text-base text-espresso-700 font-light leading-relaxed">
          Beautifully crafted cakes for your sweetest celebrations.
        </p>
        <div className="inline-flex items-center gap-1.5 bg-cream-100 border border-cream-300 px-3.5 py-1 rounded-full text-xs text-espresso-800 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>All cakes prepared fresh in standard 500g weight</span>
        </div>
      </div>

      {/* 50% Non-refundable deposit notice card */}
      <div className="bg-blush-50/80 border border-rose-200/80 rounded-luxury p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif text-base font-semibold text-espresso-900">
              Custom Order & Deposit Policy
            </h4>
            <p className="text-xs text-espresso-700 mt-0.5">
              A 50% non-refundable deposit is required to confirm your order and reserve your bake slot.
            </p>
          </div>
        </div>
        <span className="text-xs font-sans font-medium text-rose-600 bg-white border border-rose-200 px-3.5 py-1.5 rounded-full shrink-0">
          48h advance notice
        </span>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-b border-cream-300 pb-5">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { id: 'all', label: 'All Cakes (9)' },
            { id: 'chocolate', label: 'Chocolate' },
            { id: 'fruit', label: 'Fruit & Berry' },
            { id: 'premium', label: 'Signature & Premium' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all shrink-0 ${
                filter === tab.id
                  ? 'bg-rose-500 text-white shadow-soft'
                  : 'bg-cream-100 text-espresso-800 hover:bg-cream-200 border border-cream-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
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

      {/* 4-Column Grid for Cakes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
        {filteredCakes.map((cake) => (
          <ProductCard
            key={cake.id}
            product={cake}
            onCustomizeClick={(p) => setCustomizingCake(p)}
          />
        ))}
      </div>

      {/* Customization Modal */}
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
