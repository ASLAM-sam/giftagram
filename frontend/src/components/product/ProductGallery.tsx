import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedImageUrl, PLACEHOLDER_PRODUCT_IMAGE } from '../../services/imageService';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productName }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  // Reset selected image index when images array changes
  useEffect(() => {
    setSelectedImage(0);
  }, [images]);

  const validImages =
    Array.isArray(images) && images.filter(Boolean).length > 0
      ? images.filter(Boolean)
      : [PLACEHOLDER_PRODUCT_IMAGE];

  const safeIndex = selectedImage < validImages.length ? selectedImage : 0;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    if (!target.src.includes('placeholder-product.svg')) {
      target.src = PLACEHOLDER_PRODUCT_IMAGE;
    }
  };

  const currentImage = validImages[safeIndex];
  const optimizedMainSrc = getOptimizedImageUrl(currentImage, {
    width: 900,
    quality: 'auto',
    crop: 'fill',
  });

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-5">
      {/* Thumbnails (Only shown if product has more than 1 image) */}
      {validImages.length > 1 && (
        <div className="flex sm:flex-col gap-2 sm:gap-2.5 overflow-x-auto sm:overflow-y-auto shrink-0 pb-1 sm:pb-0 scrollbar-none">
          {validImages.map((img, idx) => {
            const thumbSrc = getOptimizedImageUrl(img, {
              width: 160,
              height: 160,
              quality: 'auto',
              crop: 'fill',
            });
            const isSelected = safeIndex === idx;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(idx)}
                className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-luxury overflow-hidden border-2 transition-all shrink-0 bg-cream-100 ${
                  isSelected
                    ? 'border-rose-500 shadow-soft scale-[1.02]'
                    : 'border-cream-300/80 opacity-70 hover:opacity-100'
                }`}
                aria-label={`View photo ${idx + 1} of ${productName}`}
                aria-pressed={isSelected}
              >
                <img
                  src={thumbSrc}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  onError={handleImageError}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Image Display */}
      <div className="flex-1 relative aspect-square sm:aspect-4/3 rounded-luxury-lg overflow-hidden bg-cream-100 border border-cream-200/90 shadow-card">
        <AnimatePresence mode="wait">
          <motion.img
            key={`${currentImage}-${safeIndex}`}
            src={optimizedMainSrc}
            alt={`${productName} photograph`}
            onError={handleImageError}
            loading={safeIndex === 0 ? 'eager' : 'lazy'}
            fetchPriority={safeIndex === 0 ? 'high' : 'auto'}
            decoding={safeIndex === 0 ? 'sync' : 'async'}
            initial={{ opacity: 0.4, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.4 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full object-cover select-none"
          />
        </AnimatePresence>
      </div>
    </div>
  );
};
