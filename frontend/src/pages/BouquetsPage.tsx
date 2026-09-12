import React, { useState, useMemo } from 'react';
import { BOUQUET_PRODUCTS, BOUQUET_DISCLAIMERS } from '../data/bouquets';
import { ProductCard } from '../components/product/ProductCard';
import { Info, SlidersHorizontal, AlertCircle } from 'lucide-react';

export const BouquetsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'roses' | 'chocolate' | 'photo'>('all');
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const filteredBouquets = useMemo(() => {
    let list = [...BOUQUET_PRODUCTS];

    if (filter !== 'all') {
      list = list.filter((b) => b.bouquetCategory === filter);
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
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="font-script text-4xl text-rose-500 block">
          Wrapped with love
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-espresso-900 font-medium tracking-tight">
          Bouquets
        </h1>
        <p className="text-sm sm:text-base text-espresso-700 font-light leading-relaxed">
          Flowers, chocolates and little moments, beautifully wrapped.
        </p>
      </div>

      {/* Prominent Pricing & Policy Disclaimers Banner */}
      <div className="bg-champagne-100/70 border border-champagne-300/80 rounded-luxury p-5 sm:p-6 shadow-soft">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="font-serif text-base font-semibold text-espresso-900">
              Bouquet Pricing & Customization Guidelines
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs text-espresso-800">
              {BOUQUET_DISCLAIMERS.map((note, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/70 border border-champagne-200/80 px-3 py-2 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="font-medium">{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-b border-cream-300 pb-5">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { id: 'all', label: 'All Bouquets (6)' },
            { id: 'roses', label: 'Red Roses' },
            { id: 'chocolate', label: 'Chocolate Arrangement' },
            { id: 'photo', label: 'Photo Keepsake' },
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

        {/* Sort */}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {filteredBouquets.map((bouquet) => (
          <ProductCard key={bouquet.id} product={bouquet} />
        ))}
      </div>
    </div>
  );
};
