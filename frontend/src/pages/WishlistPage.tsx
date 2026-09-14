import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { ALL_PRODUCTS } from '../data/products';
import { ProductGrid } from '../components/product/ProductGrid';
import { CakeCustomizationModal } from '../components/cake/CakeCustomizationModal';
import { productService } from '../services/productService';
import { Product } from '../types';
import { Button } from '../components/common/Button';
import { Heart, ArrowRight } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const WishlistPage: React.FC = () => {
  useDocumentTitle('Your Wishlist | Giftagram', 'View your saved artisan cakes and luxury bouquets.');

  const { wishlist } = useWishlist();
  const [allProducts, setAllProducts] = useState<Product[]>(ALL_PRODUCTS);
  const [customizingCake, setCustomizingCake] = useState<Product | null>(null);

  useEffect(() => {
    let mounted = true;
    productService.getProducts().then((data) => {
      if (mounted && data.length > 0) {
        setAllProducts(data);
      }
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const favoritedProducts = allProducts.filter((p) => wishlist.includes(p.id));

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
          Save your favourite cakes and creations by clicking the heart icon while browsing.
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-8">
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

      <ProductGrid
        products={favoritedProducts}
        onCustomizeClick={(p) => setCustomizingCake(p)}
      />

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
