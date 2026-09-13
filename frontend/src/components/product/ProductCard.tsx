import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Product } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { Heart, ArrowUpRight, Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onCustomizeClick?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onCustomizeClick }) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="group relative bg-[#FFFDF9] rounded-luxury overflow-hidden border border-cream-200/80 hover:border-rose-200 hover:shadow-card transition-all duration-300 flex flex-col"
    >
      {/* Image Container with Zoom & Wishlist */}
      <Link
        to={`/${product.category}/${product.slug}`}
        className="block relative aspect-square overflow-hidden bg-cream-100"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Wishlist button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-soft backdrop-blur-md ${
            isWishlisted
              ? 'bg-rose-500 text-white'
              : 'bg-white/85 text-espresso-700 hover:text-rose-500 hover:bg-white'
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Weight or Category Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          {product.weight && (
            <span className="bg-white/90 backdrop-blur-md text-espresso-900 text-[0.68rem] px-2 py-0.5 rounded font-medium border border-cream-200/60 shadow-sm">
              {product.weight}
            </span>
          )}
          {product.category === 'bouquets' && product.stemCount && (
            <span className="bg-white/90 backdrop-blur-md text-espresso-900 text-[0.68rem] px-2 py-0.5 rounded font-medium border border-cream-200/60 shadow-sm">
              {product.stemCount} Roses
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link to={`/${product.category}/${product.slug}`}>
              <h3 className="font-serif text-lg text-espresso-900 font-medium group-hover:text-rose-600 transition-colors leading-tight">
                {product.name}
              </h3>
            </Link>
          </div>

          <p className="text-xs text-espresso-700/85 line-clamp-2 mt-1.5 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-4 mt-3 border-t border-cream-200/60 flex items-center justify-between">
          <div>
            <span className="font-serif text-lg font-semibold text-espresso-900">
              ₹{product.price}
            </span>
            {product.category === 'cakes' && (
              <span className="text-[0.68rem] text-espresso-600 block -mt-0.5">
                50% deposit: ₹{Math.round(product.price * 0.5)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {product.category === 'cakes' ? (
              <Link
                to={`/cakes/${product.slug}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-blush-50 hover:bg-blush-100 px-3 py-1.5 rounded-full transition-colors border border-rose-200/60"
              >
                <span>View Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                onClick={handleQuickAdd}
                className="inline-flex items-center gap-1 text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-full transition-colors shadow-soft"
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
