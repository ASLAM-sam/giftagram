import React from 'react';
import { Link } from 'react-router-dom';
import { COMING_SOON_CATEGORIES } from '../data/comingSoon';
import { ComingSoonCategoryCard } from '../components/product/ComingSoonCategoryCard';
import { Button } from '../components/common/Button';
import { ArrowRight, Lock } from 'lucide-react';

export const ComingSoonPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="font-script text-4xl text-rose-500 block">
          Future Collections
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-espresso-900 font-medium tracking-tight">
          More Beautiful Things Are Coming
        </h1>
        <p className="text-sm sm:text-base text-espresso-700 font-light leading-relaxed">
          From cupcakes and hampers to bridal trousseau pieces and thoughtful memory frames, our studio is continuously dreaming up new ways to celebrate.
        </p>

        {/* Current Active Categories Banner */}
        <div className="pt-2 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-cream-100 border border-cream-300 px-3.5 py-1.5 rounded-full text-xs text-espresso-800 font-medium">
            <Lock className="w-3.5 h-3.5 text-rose-500" />
            <span>These collections are currently in preview and cannot yet be purchased online.</span>
          </span>
        </div>
      </div>

      {/* Grid of Coming Soon Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {COMING_SOON_CATEGORIES.map((cat) => (
          <ComingSoonCategoryCard key={cat.id} category={cat} />
        ))}
      </div>

      {/* Callout to active products */}
      <div className="bg-[#FFFDF9] rounded-luxury-lg border border-cream-300 p-8 text-center space-y-4 max-w-3xl mx-auto shadow-card">
        <span className="font-script text-3xl text-rose-500 block">
          Ready to celebrate today?
        </span>
        <h3 className="font-serif text-2xl text-espresso-900 font-medium">
          Explore Our Active Cakes & Bouquets Menu
        </h3>
        <p className="text-xs text-espresso-700 max-w-lg mx-auto leading-relaxed">
          Our freshly baked 500g cakes and hand-arranged red rose bouquets are available for online booking with 48-hour studio pickup.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link to="/cakes">
            <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
              Explore Cakes (500g)
            </Button>
          </Link>
          <Link to="/bouquets">
            <Button variant="secondary" size="md">
              Explore Bouquets
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
