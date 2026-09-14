import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ALL_PRODUCTS } from '../data/products';
import { ProductGrid } from '../components/product/ProductGrid';
import { ProductGridSkeleton } from '../components/common/ProductGridSkeleton';
import { CakeCustomizationModal } from '../components/cake/CakeCustomizationModal';
import { productService } from '../services/productService';
import { Product } from '../types';
import { SlidersHorizontal } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const ShopPage: React.FC = () => {
  useDocumentTitle(
    'Artisan Menu & Collections | Giftagram',
    'Browse our full collection of fresh 500g cakes, hand-tied luxury bouquets, and bespoke gifts.'
  );

  const { category: routeCategory } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCategory = searchParams.get('category') || undefined;
  const initialTab = routeCategory || queryCategory || 'all';

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [customizingCake, setCustomizingCake] = useState<Product | null>(null);

  // Sync tab with URL parameter if it changes
  useEffect(() => {
    if (routeCategory) {
      setActiveTab(routeCategory);
    } else if (queryCategory) {
      setActiveTab(queryCategory);
    }
  }, [routeCategory, queryCategory]);

  // Fetch live active catalog from D1 API
  useEffect(() => {
    let mounted = true;
    const fetchCatalog = async () => {
      try {
        const data = await productService.getProducts();
        if (mounted && data.length > 0) {
          setProducts(data);
        } else if (mounted) {
          setProducts(ALL_PRODUCTS);
        }
      } catch (err) {
        console.warn('[ShopPage] Failed to fetch catalog from API, using fallback data:', err);
        if (mounted) setProducts(ALL_PRODUCTS);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  // Compute all unique categories dynamically
  const dynamicCategories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category;
      if (cat) {
        counts.set(cat, (counts.get(cat) || 0) + 1);
      }
    });

    const categoryList: { id: string; label: string; count: number }[] = [
      { id: 'all', label: 'All Products', count: products.length },
    ];

    // Known standard order: cakes, bouquets, then any others alphabetically
    const standardOrder = ['cakes', 'bouquets'];
    standardOrder.forEach((cat) => {
      if (counts.has(cat)) {
        categoryList.push({
          id: cat,
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
          count: counts.get(cat)!,
        });
        counts.delete(cat);
      }
    });

    // Any new / admin-created categories
    Array.from(counts.keys())
      .sort()
      .forEach((cat) => {
        // Format label nicely: e.g. "gift-hampers" -> "Gift Hampers"
        const formattedLabel = cat
          .split(/[-_ ]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        categoryList.push({
          id: cat,
          label: formattedLabel,
          count: counts.get(cat)!,
        });
      });

    return categoryList;
  }, [products]);

  const displayedProducts = useMemo(() => {
    let list = [...products];

    if (activeTab !== 'all') {
      list = list.filter((p) => p.category === activeTab);
    }

    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, activeTab, sort]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ category: tabId }, { replace: true });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="font-script text-3xl sm:text-4xl text-rose-500 block">
          The entire collection
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-espresso-900 font-medium tracking-tight">
          Shop All Creations
        </h1>
        <p className="text-xs sm:text-base text-espresso-700 font-light leading-relaxed">
          Explore our artisanal creations, freshly baked cakes, and romantic hand-tied bouquets.
        </p>
      </div>

      {/* Dynamic Tabs and Sort */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-b border-cream-300 pb-4">
        {/* Dynamic Category Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {dynamicCategories.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[0.72rem] sm:text-xs font-medium tracking-wide transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-rose-500 text-white shadow-soft'
                  : 'bg-cream-100 text-espresso-800 hover:bg-cream-200 border border-cream-300'
              }`}
            >
              {tab.label} ({tab.count})
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
        <ProductGridSkeleton count={8} />
      ) : (
        <ProductGrid
          products={displayedProducts}
          onCustomizeClick={(p) => setCustomizingCake(p)}
        />
      )}

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
