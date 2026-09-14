import React, { useState, useMemo, useEffect } from 'react';
import { BOUQUET_PRODUCTS, BOUQUET_DISCLAIMERS } from '../data/bouquets';
import { ProductGrid } from '../components/product/ProductGrid';
import { ProductGridSkeleton } from '../components/common/ProductGridSkeleton';
import { productService } from '../services/productService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Product } from '../types';
import { Info, SlidersHorizontal, AlertCircle } from 'lucide-react';

export const BouquetsPage: React.FC = () => {
  useDocumentTitle(
    'Luxury Bouquets | Giftagram',
    'Handcrafted floral arrangements, fresh red rose bouquets, chocolate bouquets, and photo keepsakes.'
  );

  const [bouquets, setBouquets] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'roses' | 'chocolate' | 'photo'>('all');
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  useEffect(() => {
    let mounted = true;
    const fetchBouquets = async () => {
      try {
        const data = await productService.getProducts('bouquets');
        if (mounted && data.length > 0) {
          setBouquets(data);
        } else if (mounted) {
          setBouquets(BOUQUET_PRODUCTS);
        }
      } catch (err) {
        console.warn('Could not fetch bouquets from API, staying with seeded catalog:', err);
        if (mounted) setBouquets(BOUQUET_PRODUCTS);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchBouquets();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredBouquets = useMemo(() => {
    let list = [...bouquets];

    if (filter !== 'all') {
      list = list.filter((b) => b.bouquetCategory === filter);
    }

    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [bouquets, filter, sort]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="font-script text-3xl sm:text-4xl text-rose-500 block">
          Wrapped with love
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-espresso-900 font-medium tracking-tight">
          Bouquets
        </h1>
        <p className="text-xs sm:text-base text-espresso-700 font-light leading-relaxed">
          Flowers, chocolates and little moments, beautifully wrapped.
        </p>
      </div>

      {/* Prominent Pricing & Policy Disclaimers Banner */}
      <div className="bg-champagne-100/70 border border-champagne-300/80 rounded-luxury p-3.5 sm:p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="font-serif text-sm sm:text-base font-semibold text-espresso-900">
              Bouquet Pricing & Customization Guidelines
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-0.5 text-xs text-espresso-800">
              {BOUQUET_DISCLAIMERS.map((note, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/70 border border-champagne-200/80 px-2.5 py-1.5 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="font-medium text-[0.7rem] sm:text-xs">{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-b border-cream-300 pb-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: `All Bouquets (${bouquets.length})` },
            { id: 'roses', label: 'Red Roses' },
            { id: 'chocolate', label: 'Chocolate Arrangement' },
            { id: 'photo', label: 'Photo Keepsake' },
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

        {/* Sort */}
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

      {/* Generic Reusable Product Grid */}
      {isLoading ? (
        <ProductGridSkeleton count={6} />
      ) : (
        <ProductGrid products={filteredBouquets} />
      )}
    </div>
  );
};
