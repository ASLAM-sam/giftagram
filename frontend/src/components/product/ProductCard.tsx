import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Product } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { getOptimizedImageUrl, getResponsiveSrcSet, CARD_IMAGE_SIZES } from '../../services/imageService';
import { Heart, ArrowUpRight, Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  onCustomizeClick?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false, onCustomizeClick }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useUI();
  const isWishlisted = isInWishlist(product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
    showToast(
      isWishlisted ? `Removed ${product.name} from wishlist` : `Added ${product.name} to wishlist`,
      'info'
    );
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // For cakes, if customization is preferred, trigger customize callback or add standard
    if (product.category === 'cakes' && onCustomizeClick) {
      onCustomizeClick(product);
    } else {
      addToCart(product, 1);
      showToast(`Added ${product.name} to your basket`);
    }
  };

  const primaryImage = product.images[0] || '/images/cakes/chocolate-belgium.jpg';
  const optimizedSrc = getOptimizedImageUrl(primaryImage, { width: 500, crop: 'fill' });
  const responsiveSrcSet = getResponsiveSrcSet(primaryImage, [280, 420, 560, 750]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="group relative bg-[#FFFDF9] rounded-luxury overflow-hidden border border-cream-200/80 hover:border-rose-200 hover:shadow-card transition-all duration-300 flex flex-col h-full"
    >
      {/* Image Container with Aspect Ratio Enforcement (Eliminates CLS) */}
      <Link
        to={`/${product.category}/${product.slug}`}
        className="block relative aspect-square overflow-hidden bg-cream-100"
      >
        <img
          src={optimizedSrc}
          srcSet={responsiveSrcSet}
          sizes={CARD_IMAGE_SIZES}
          alt={product.name}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Wishlist button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-soft backdrop-blur-md ${
            isWishlisted
              ? 'bg-rose-500 text-white'
              : 'bg-white/85 text-espresso-700 hover:text-rose-500 hover:bg-white'
          }`}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Weight or Category Badge */}
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex items-center gap-1">
          {product.weight && (
            <span className="bg-white/90 backdrop-blur-md text-espresso-900 text-[0.62rem] sm:text-[0.68rem] px-1.5 sm:px-2 py-0.5 rounded font-medium border border-cream-200/60 shadow-sm">
              {product.weight}
            </span>
          )}
          {product.category === 'bouquets' && product.stemCount && (
            <span className="bg-white/90 backdrop-blur-md text-espresso-900 text-[0.62rem] sm:text-[0.68rem] px-1.5 sm:px-2 py-0.5 rounded font-medium border border-cream-200/60 shadow-sm">
              {product.stemCount} Roses
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/${product.category}/${product.slug}`} className="block">
            <h3 className="font-serif text-sm sm:text-base lg:text-lg text-espresso-900 font-medium group-hover:text-rose-600 transition-colors leading-snug line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Description visible on sm+ screens to keep mobile grid cards compact and uniform */}
          {product.shortDescription && (
            <p className="hidden sm:block text-xs text-espresso-700/85 line-clamp-2 mt-1.5 leading-relaxed">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-cream-200/60 flex items-center justify-between gap-1">
          <div className="min-w-0 flex-1">
            <span className="font-serif text-sm sm:text-base lg:text-lg font-semibold text-espresso-900 truncate block">
              ₹{product.price}
            </span>
            {product.category === 'cakes' && (
              <span className="text-[0.6rem] sm:text-[0.68rem] text-espresso-600 block -mt-0.5 truncate">
                50% dep: ₹{Math.round(product.price * 0.5)}
              </span>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-1">
            {product.category === 'cakes' ? (
              <div className="flex items-center gap-1">
                {onCustomizeClick && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCustomizeClick(product);
                    }}
                    className="inline-flex items-center justify-center text-[0.68rem] sm:text-[0.72rem] font-medium text-white bg-rose-500 hover:bg-rose-600 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full transition-colors shadow-soft"
                    aria-label={`Customize ${product.name}`}
                  >
                    <span>Customize</span>
                  </button>
                )}
                <Link
                  to={`/cakes/${product.slug}`}
                  className="p-1 sm:px-2 sm:py-1.5 rounded-full text-rose-600 hover:text-rose-700 bg-blush-50 hover:bg-blush-100 transition-colors border border-rose-200/60 flex items-center gap-1 text-[0.68rem] sm:text-[0.72rem]"
                  aria-label={`View details for ${product.name}`}
                  title="View Details"
                >
                  <span className="hidden md:inline">Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <button
                onClick={handleQuickAdd}
                className="inline-flex items-center justify-center gap-1 text-[0.7rem] sm:text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors shadow-soft"
                aria-label={`Add ${product.name} to basket`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
