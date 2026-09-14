import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { ALL_PRODUCTS } from '../data/products';
import { ProductCard } from '../components/product/ProductCard';
import { CakeCustomizationModal } from '../components/cake/CakeCustomizationModal';
import { Product } from '../types';
import { Button } from '../components/common/Button';
import { Heart, ArrowRight } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const WishlistPage: React.FC = () => {
  useDocumentTitle('Your Wishlist | Giftagram', 'View your saved artisan cakes and luxury bouquets.');

  const { wishlist } = useWishlist();
  const [customizingCake, setCustomizingCake] = useState<Product | null>(null);

  const favoritedProducts = ALL_PRODUCTS.filter((p) => wishlist.includes(p.id));

  if (favoritedProducts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-blush-100 flex items-center justify-center text-rose-500">
          <Heart className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h2 className="font-serif text-3xl text-espresso-900 font-medium">
          Your wishlist is empty.
        </h2>
        <p className="text-xs sm:text-sm text-espresso-600 max-w-sm mx-auto">
          Save your favourite cakes and bouquets by clicking the heart icon while browsing.
        </p>
        <div className="pt-2">
          <Link to="/shop">
            <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
              Explore Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="font-script text-3xl text-rose-500 block">
          Saved with love
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium">
          Your Wishlist ({favoritedProducts.length})
        </h1>
        <p className="text-xs sm:text-sm text-espresso-600">
          Your personally saved artisanal cakes and romantic bouquets.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
        {favoritedProducts.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={idx < 4}
            onCustomizeClick={(p) => setCustomizingCake(p)}
          />
        ))}
      </div>

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
