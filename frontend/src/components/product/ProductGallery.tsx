import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productName }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const validImages = images && images.length > 0 ? images : ['/images/cakes/chocolate-belgium.jpg'];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    if (!target.src.includes('chocolate-belgium.jpg')) {
      target.src = '/images/cakes/chocolate-belgium.jpg';
    }
  };

  const safeIndex = selectedImage < validImages.length ? selectedImage : 0;

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4 sm:gap-5">
      {/* Thumbnails (Side or Bottom) */}
      <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto shrink-0 pb-2 sm:pb-0">
        {validImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImage(idx)}
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-luxury overflow-hidden border-2 transition-all shrink-0 bg-cream-100 ${
              safeIndex === idx
                ? 'border-rose-500 shadow-soft'
                : 'border-cream-300 opacity-70 hover:opacity-100'
            }`}
            aria-label={`View photo ${idx + 1} of ${productName}`}
          >
            <img
              src={img}
              alt={`${productName} thumbnail ${idx + 1}`}
              onError={handleImageError}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main Image Display */}
      <div className="flex-1 relative aspect-square sm:aspect-4/3 rounded-luxury-lg overflow-hidden bg-cream-100 border border-cream-200 shadow-card">
        <AnimatePresence mode="wait">
          <motion.img
            key={safeIndex}
            src={validImages[safeIndex]}
            alt={`${productName} photograph`}
            onError={handleImageError}
            initial={{ opacity: 0.3, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.3 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-full object-cover select-none"
          />
        </AnimatePresence>
      </div>
    </div>
  );
};
