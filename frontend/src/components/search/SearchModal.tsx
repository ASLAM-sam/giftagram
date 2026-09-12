import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../../context/UIContext';
import { searchProducts } from '../../data/products';
import { Product } from '../../types';
import { Search, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, closeSearch } = useUI();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const found = searchProducts(query);
    setResults(found);
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 sm:px-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSearch}
            className="fixed inset-0 bg-espresso-900/30 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-[#FFFDF9] rounded-luxury-lg shadow-modal border border-cream-300 overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="p-4 sm:p-5 border-b border-cream-200 flex items-center gap-3">
              <Search className="w-5 h-5 text-rose-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cakes, bouquets, flavours, chocolate..."
                className="w-full bg-transparent text-espresso-900 placeholder:text-espresso-600/60 text-base md:text-lg focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-espresso-600 hover:text-espresso-900 rounded-full hover:bg-cream-100"
                  aria-label="Clear search input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={closeSearch}
                className="text-xs uppercase tracking-widest text-espresso-600 hover:text-rose-600 px-2 py-1"
                aria-label="Close search"
              >
                ESC
              </button>
            </div>

            {/* Quick Suggestions / Results */}
            <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6">
              {query.trim() === '' ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-espresso-600 mb-3">
                    Popular Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Chocolate', 'Roses', 'Biscoff', 'Fruit', 'Photo Bouquet', 'Nutella'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setQuery(tag)}
                        className="px-3 py-1.5 rounded-full bg-cream-100 hover:bg-blush-100 text-espresso-800 text-xs transition-colors border border-cream-300/80"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-espresso-600 mb-3">
                    Found {results.length} item{results.length > 1 ? 's' : ''} for "{query}"
                  </p>
                  <div className="divide-y divide-cream-200">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        to={`/${product.category}/${product.slug}`}
                        onClick={closeSearch}
                        className="flex items-center gap-4 py-3 group hover:bg-blush-50/60 -mx-3 px-3 rounded-lg transition-colors"
                      >
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-14 h-14 object-cover rounded-md border border-cream-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif text-base text-espresso-900 group-hover:text-rose-600 font-medium transition-colors truncate">
                              {product.name}
                            </h4>
                            {product.weight && (
                              <span className="text-[0.68rem] bg-cream-200 text-espresso-700 px-1.5 py-0.5 rounded font-medium">
                                {product.weight}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-espresso-600 truncate mt-0.5">
                            {product.shortDescription}
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span className="font-serif text-sm font-semibold text-espresso-900">
                            ₹{product.price}
                          </span>
                          <ArrowRight className="w-4 h-4 text-espresso-600 group-hover:text-rose-500 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 px-4">
                  <p className="font-serif text-xl text-espresso-900 mb-1">
                    We couldn't find that just yet.
                  </p>
                  <p className="text-xs text-espresso-600 max-w-sm mx-auto mb-5">
                    Try searching for "chocolate", "roses", "berry", or explore all our creations.
                  </p>
                  <Link
                    to="/shop"
                    onClick={closeSearch}
                    className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-rose-600 hover:text-rose-700 bg-blush-100 hover:bg-blush-200 px-4 py-2 rounded-full transition-colors"
                  >
                    Browse Everything
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
