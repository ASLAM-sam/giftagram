import React, { useState, useMemo, useEffect } from 'react';
import { CAKE_PRODUCTS } from '../data/cakes';
import { ProductGrid } from '../components/product/ProductGrid';
import { CakeCustomizationModal } from '../components/cake/CakeCustomizationModal';
import { ProductGridSkeleton } from '../components/common/ProductGridSkeleton';
import { productService } from '../services/productService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Product } from '../types';
import { ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';

export const CakesPage: React.FC = () => {
  useDocumentTitle(
    'Artisan Cakes | Giftagram',
    'Handcrafted 500g cakes made fresh to order with Belgian chocolate, real fruit, and custom lettering.'
  );

  const [cakes, setCakes] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'chocolate' | 'fruit' | 'premium'>('all');
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [customizingCake, setCustomizingCake] = useState<Product | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchCakes = async () => {
      try {
        const data = await productService.getProducts('cakes');
        if (mounted && data.length > 0) {
          setCakes(data);
        } else if (mounted) {
          setCakes(CAKE_PRODUCTS);
        }
      } catch (err) {
        console.warn('Could not fetch cakes from API, staying with seeded catalog:', err);
        if (mounted) setCakes(CAKE_PRODUCTS);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchCakes();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCakes = useMemo(() => {
    let list = [...cakes];

    if (filter !== 'all') {
      list = list.filter((cake) => cake.flavorCategory === filter);
    }

    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [cakes, filter, sort]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="font-script text-3xl sm:text-4xl text-rose-500 block">
          Freshly baked
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-espresso-900 font-medium tracking-tight">
          Cakes
        </h1>
        <p className="text-xs sm:text-base text-espresso-700 font-light leading-relaxed">
          Beautifully crafted cakes for your sweetest celebrations.
        </p>
        <div className="inline-flex items-center gap-1.5 bg-cream-100 border border-cream-300 px-3 py-0.5 rounded-full text-[0.72rem] sm:text-xs text-espresso-800 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>All cakes prepared fresh in standard 500g weight</span>
        </div>
      </div>

      {/* 50% Non-refundable deposit notice card */}
      <div className="bg-blush-50/80 border border-rose-200/80 rounded-luxury p-3.5 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-soft">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="font-serif text-sm sm:text-base font-semibold text-espresso-900">
              Custom Order & Deposit Policy
            </h4>
            <p className="text-[0.72rem] sm:text-xs text-espresso-700 mt-0.5">
              A 50% non-refundable deposit is required to confirm your order and reserve your bake slot.
            </p>
          </div>
        </div>
        <span className="text-[0.68rem] sm:text-xs font-sans font-medium text-rose-600 bg-white border border-rose-200 px-3 py-1 rounded-full shrink-0">
          48h advance notice
        </span>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-b border-cream-300 pb-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: `All Cakes (${cakes.length})` },
            { id: 'chocolate', label: 'Chocolate' },
            { id: 'fruit', label: 'Fruit & Berry' },
            { id: 'premium', label: 'Signature & Premium' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[0.72rem] sm:text-xs font-medium tracking-wide transition-all shrink-0 cursor-pointer ${
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
            className="bg-white border border-cream-300 rounded-lg px-2.5 py-1 text-xs text-espresso-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
          >
            <option value="featured">Featured Collection</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Reusable Product Grid */}
      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : (
        <ProductGrid
          products={filteredCakes}
          onCustomizeClick={(p) => setCustomizingCake(p)}
        />
      )}

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
