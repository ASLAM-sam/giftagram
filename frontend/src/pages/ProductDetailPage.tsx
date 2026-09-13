import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductBySlug as getLocalProduct, ALL_PRODUCTS } from '../data/products';
import { ProductGallery } from '../components/product/ProductGallery';
import { CakeCustomizationModal } from '../components/cake/CakeCustomizationModal';
import { ProductCard } from '../components/product/ProductCard';
import { ProductDetailsSkeleton } from '../components/common/ProductDetailsSkeleton';
import { productService } from '../services/productService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useUI } from '../context/UIContext';
import { Button } from '../components/common/Button';
import { Product, ProductCategory } from '../types';
import {
  Heart,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const initialLocal = getLocalProduct(slug || '');
  const [product, setProduct] = useState<Product | null>(initialLocal || null);
  const [isLoading, setIsLoading] = useState(!initialLocal);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useUI();

  useDocumentTitle(
    product ? `${product.name} | Giftagram` : 'Artisanal Creation | Giftagram',
    product?.shortDescription
  );

  useEffect(() => {
    let mounted = true;
    if (slug) {
      // Determine category or search
      const category: ProductCategory = window.location.pathname.includes('/bouquets/') ? 'bouquets' : 'cakes';
      productService.getProductBySlug(category, slug).then((res) => {
        if (mounted && res) {
          setProduct(res);
        }
        if (mounted) setIsLoading(false);
      });
    }
    return () => {
      mounted = false;
    };
  }, [slug]);

  const [quantity, setQuantity] = useState(1);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  if (isLoading) {
    return <ProductDetailsSkeleton />;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="font-serif text-3xl text-espresso-900 mb-3">
          Creation Not Found
        </h2>
        <p className="text-sm text-espresso-600 mb-6">
          The requested cake or bouquet does not exist in our studio menu.
        </p>
        <Link to="/shop">
          <Button variant="primary" size="md">
            Return to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const depositAmount = Math.round(product.price * 0.5);
  const related = ALL_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    showToast(`Added ${quantity} × ${product.name} to basket`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard', 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      {/* Back breadcrumb */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-espresso-600 hover:text-rose-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to collection</span>
        </button>
      </div>

      {/* Main Grid: Left Gallery, Right Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left: Product Image Gallery */}
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Right: Product Details & Purchase Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header & Badges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold bg-blush-100 px-3 py-1 rounded-full">
                {product.category === 'cakes' ? 'Bespoke Cake' : 'Floral Arrangement'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full border border-cream-300 text-espresso-600 hover:text-rose-600 hover:bg-cream-100 transition-colors"
                  aria-label="Share product"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-2 rounded-full border border-cream-300 transition-colors ${
                    isWishlisted ? 'bg-rose-500 text-white border-rose-500' : 'text-espresso-600 hover:text-rose-600 hover:bg-cream-100'
                  }`}
                  aria-label="Save to wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium leading-tight">
              {product.name}
            </h1>

            {/* Weight / Stem count */}
            <div className="flex items-center gap-2.5 pt-1">
              {product.weight && (
                <span className="text-xs bg-cream-200 text-espresso-800 px-2.5 py-1 rounded-md font-semibold tracking-wide">
                  Standard: {product.weight}
                </span>
              )}
              {product.stemCount && (
                <span className="text-xs bg-cream-200 text-espresso-800 px-2.5 py-1 rounded-md font-semibold tracking-wide">
                  {product.stemCount} Red Roses
                </span>
              )}
              <span className="text-xs text-espresso-600">
                • {product.leadTimeHours}h notice required
              </span>
            </div>
          </div>

          {/* Pricing & Deposit Breakdown */}
          <div className="p-4 rounded-luxury bg-cream-50/80 border border-cream-200 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-semibold text-espresso-900">
                ₹{product.price}
              </span>
              <span className="text-xs text-espresso-600">Inclusive of handcrafted styling</span>
            </div>

            {product.category === 'cakes' && (
              <div className="pt-2 text-xs text-rose-600 flex items-center gap-1.5 border-t border-cream-200/80 mt-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                <span>50% non-refundable deposit to confirm: ₹{depositAmount} (Balance due on pickup)</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-espresso-900">
              The Creation
            </h4>
            <p className="text-sm text-espresso-700 leading-relaxed font-light">
              {product.description}
            </p>
          </div>

          {/* Bouquet Specific Disclaimers */}
          {product.category === 'bouquets' && product.disclaimers && (
            <div className="p-4 rounded-luxury bg-champagne-100/60 border border-champagne-200/80 space-y-2 text-xs text-espresso-800">
              <p className="font-semibold flex items-center gap-1.5 text-rose-600">
                <AlertCircle className="w-3.5 h-3.5" />
                Please Note:
              </p>
              <ul className="space-y-1 pl-4 list-disc text-espresso-700">
                {product.disclaimers.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions: Quantity + Add / Customize */}
          <div className="pt-4 border-t border-cream-200 space-y-3">
            {product.category === 'cakes' ? (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => setIsCustomizeModalOpen(true)}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Customize & Order Cake
                </Button>
                <button
                  onClick={handleAddToCart}
                  className="w-full text-center text-xs text-espresso-700 hover:text-rose-600 underline underline-offset-4 py-1 font-medium"
                >
                  Or quick-add standard cake without custom lettering
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Quantity selector */}
                <div className="flex items-center border border-cream-300 rounded-full bg-white h-12 px-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-full flex items-center justify-center text-espresso-700 hover:text-rose-600"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-espresso-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-full flex items-center justify-center text-espresso-700 hover:text-rose-600"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleAddToCart}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add to Basket • ₹{product.price * quantity}
                </Button>
              </div>
            )}
          </div>

          {/* Reassurance points */}
          <div className="pt-4 grid grid-cols-2 gap-3 text-[0.72rem] text-espresso-600 border-t border-cream-200">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Baked & arranged fresh to order</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Studio pickup with ribbon box</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="pt-12 border-t border-cream-200 space-y-8">
          <div className="text-center">
            <span className="font-script text-3xl text-rose-500 block">
              You may also adore
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-espresso-900 font-medium mt-1">
              Complementary Creations
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}

      {/* Customization Modal */}
      {isCustomizeModalOpen && (
        <CakeCustomizationModal
          isOpen={isCustomizeModalOpen}
          onClose={() => setIsCustomizeModalOpen(false)}
          product={product}
        />
      )}
    </div>
  );
};
