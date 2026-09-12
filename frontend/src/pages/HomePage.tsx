import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CAKE_PRODUCTS } from '../data/cakes';
import { BOUQUET_PRODUCTS } from '../data/bouquets';
import { COMING_SOON_CATEGORIES } from '../data/comingSoon';
import { ProductCard } from '../components/product/ProductCard';
import { ComingSoonCategoryCard } from '../components/product/ComingSoonCategoryCard';
import { CakeCustomizationModal } from '../components/cake/CakeCustomizationModal';
import { Product } from '../types';
import { BRAND_CONFIG, CONTACT_CONFIG } from '../config/brand';
import { Button } from '../components/common/Button';
import { InstagramIcon } from '../components/common/InstagramIcon';
import {
  Sparkles,
  Heart,
  Clock,
  Gift,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [customizingCake, setCustomizingCake] = useState<Product | null>(null);

  const featuredCakes = CAKE_PRODUCTS.slice(0, 4);
  const featuredBouquets = BOUQUET_PRODUCTS.slice(0, 4);
  const futureShowcase = COMING_SOON_CATEGORIES.slice(0, 6);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-[#FAF7F2] via-[#FBF0F2]/40 to-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blush-100 border border-rose-200/70 text-rose-600 text-xs font-medium tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bespoke Gifting & Artisanal Bakery</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-espresso-900 leading-[1.15] font-normal tracking-tight">
                Little things, <br />
                <span className="font-script text-5xl sm:text-6xl md:text-7xl text-rose-500 lowercase -ml-1">
                  beautifully
                </span>{' '}
                made.
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-espresso-700/90 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                {BRAND_CONFIG.shortDescription} Hand-crafted 500g cakes and romantic floral arrangements made to celebrate life's sweetest milestones.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/cakes">
                  <Button variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                    Shop Cakes (500g)
                  </Button>
                </Link>
                <Link to="/bouquets">
                  <Button variant="secondary" size="lg">
                    Explore Bouquets
                  </Button>
                </Link>
              </div>

              {/* Deposit assurance */}
              <p className="text-xs text-espresso-600/80 flex items-center justify-center lg:justify-start gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Made to order with love • 50% deposit secures your celebration date</span>
              </p>
            </motion.div>

            {/* Right Hero Lifestyle Composition */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative border frame */}
                <div className="absolute -inset-3 bg-gradient-to-tr from-rose-200/50 via-champagne-200/40 to-blush-200/50 rounded-luxury-lg blur-lg opacity-60" />
                
                {/* Main Hero Card */}
                <div className="relative rounded-luxury-lg overflow-hidden border border-cream-300 shadow-card bg-white p-2">
                  <img
                    src="/images/cakes/royal-chocolate.jpg"
                    alt="Artisanal Royal Chocolate Cake and Floral Setting"
                    className="w-full aspect-4/3 object-cover rounded-luxury"
                  />
                  
                  {/* Floating badge */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-3.5 rounded-luxury border border-cream-200/80 shadow-soft flex items-center justify-between">
                    <div>
                      <p className="font-serif text-sm font-medium text-espresso-900">
                        Handcrafted Everyday
                      </p>
                      <p className="text-[0.68rem] text-rose-500 font-sans tracking-wide">
                        Fresh ingredients • Custom lettering
                      </p>
                    </div>
                    <span className="text-xs font-serif font-semibold text-espresso-900 bg-cream-100 px-2.5 py-1 rounded-md">
                      From ₹499
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. TRUST / BRAND STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFFDF9] rounded-luxury-lg border border-cream-300/80 shadow-soft py-6 px-6 sm:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blush-100 flex items-center justify-center text-rose-500 shrink-0">
                <Heart className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold text-espresso-900">
                  Handcrafted with Love
                </h4>
                <p className="text-[0.7rem] text-espresso-600">
                  Baked fresh for every order
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blush-100 flex items-center justify-center text-rose-500 shrink-0">
                <Clock className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold text-espresso-900">
                  Made to Order
                </h4>
                <p className="text-[0.7rem] text-espresso-600">
                  48-hour advance notice
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blush-100 flex items-center justify-center text-rose-500 shrink-0">
                <Sparkles className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold text-espresso-900">
                  Premium Ingredients
                </h4>
                <p className="text-[0.7rem] text-espresso-600">
                  Pure Belgian couverture & fresh fruit
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blush-100 flex items-center justify-center text-rose-500 shrink-0">
                <Gift className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold text-espresso-900">
                  Thoughtfully Packaged
                </h4>
                <p className="text-[0.7rem] text-espresso-600">
                  Boutique ribbon & aesthetic boxes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORY SHOWCASE ("Made for your moments") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="font-script text-3xl text-rose-500 block">
            Made for your moments
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium mt-1">
            Thoughtfully Curated Collections
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cakes Showcase Card */}
          <div className="group relative rounded-luxury-lg overflow-hidden border border-cream-300 shadow-card bg-white flex flex-col justify-between">
            <div className="relative aspect-16/10 overflow-hidden bg-cream-100">
              <img
                src="/images/cakes/chocolate-belgium.jpg"
                alt="Cakes collection"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/60 via-espresso-900/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="text-[0.68rem] uppercase tracking-widest bg-rose-500/90 text-white px-2.5 py-1 rounded-full font-medium">
                  500g Celebrations
                </span>
                <h3 className="font-serif text-3xl font-medium mt-2">
                  Artisanal Cakes
                </h3>
                <p className="text-xs text-white/90 mt-1 max-w-md font-light">
                  Beautifully crafted cakes for every celebration. From rich Belgian cocoa to seasonal fruits.
                </p>
              </div>
            </div>
            <div className="p-6 bg-[#FFFDF9] flex items-center justify-between">
              <div>
                <p className="text-xs text-espresso-600">9 Signature Flavours</p>
                <p className="font-serif text-base font-semibold text-espresso-900">Starting from ₹499</p>
              </div>
              <Link to="/cakes">
                <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  Explore Cakes
                </Button>
              </Link>
            </div>
          </div>

          {/* Bouquets Showcase Card */}
          <div className="group relative rounded-luxury-lg overflow-hidden border border-cream-300 shadow-card bg-white flex flex-col justify-between">
            <div className="relative aspect-16/10 overflow-hidden bg-cream-100">
              <img
                src="/images/bouquets/rose-bouquet.jpg"
                alt="Bouquets collection"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/60 via-espresso-900/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="text-[0.68rem] uppercase tracking-widest bg-rose-500/90 text-white px-2.5 py-1 rounded-full font-medium">
                  Floral & Keepsakes
                </span>
                <h3 className="font-serif text-3xl font-medium mt-2">
                  Bouquets
                </h3>
                <p className="text-xs text-white/90 mt-1 max-w-md font-light">
                  Flowers and chocolates, arranged to make someone smile. Keepsake photo and rose arrangements.
                </p>
              </div>
            </div>
            <div className="p-6 bg-[#FFFDF9] flex items-center justify-between">
              <div>
                <p className="text-xs text-espresso-600">Red Roses & Chocolates</p>
                <p className="font-serif text-base font-semibold text-espresso-900">Starting from ₹450</p>
              </div>
              <Link to="/bouquets">
                <Button variant="secondary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  Explore Bouquets
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED CAKES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="font-script text-3xl text-rose-500 block">
              Something sweet
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium">
              Our Cakes
            </h2>
            <p className="text-xs text-espresso-600 mt-1">
              All cakes crafted in 500g standard size with custom lettering available.
            </p>
          </div>
          <Link to="/cakes">
            <Button variant="outline" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All 9 Cakes
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCakes.map((cake) => (
            <ProductCard
              key={cake.id}
              product={cake}
              onCustomizeClick={(p) => setCustomizingCake(p)}
            />
          ))}
        </div>
      </section>

      {/* 5. FEATURED BOUQUETS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="font-script text-3xl text-rose-500 block">
              Wrapped with love
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium">
              Flowers, wrapped with love.
            </h2>
            <p className="text-xs text-espresso-600 mt-1">
              Fresh long-stem red roses, artisanal chocolates, and personalized memory prints.
            </p>
          </div>
          <Link to="/bouquets">
            <Button variant="outline" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Bouquets
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBouquets.map((bouquet) => (
            <ProductCard key={bouquet.id} product={bouquet} />
          ))}
        </div>

        {/* Bouquet notes notice */}
        <div className="mt-6 p-4 rounded-luxury bg-champagne-100/60 border border-champagne-200/80 text-xs text-espresso-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Important: Prices listed are for red roses only. Additional charges apply for adding gypsy. Theme charges may vary.</span>
          </div>
          <Link to="/bouquets" className="text-rose-600 font-medium hover:underline shrink-0">
            Read Floral Guide &rarr;
          </Link>
        </div>
      </section>

      {/* 6. INSTAGRAM-INSPIRED FUTURE CATEGORIES ("More beautiful things are coming") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="font-script text-3xl text-rose-500 block">
            The studio collection
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium mt-1">
            More beautiful things are coming.
          </h2>
          <p className="text-xs sm:text-sm text-espresso-700 mt-2 leading-relaxed">
            We're always creating something new. From cupcakes and hampers to trousseau pieces and thoughtful little details, our collection will keep growing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {futureShowcase.map((cat) => (
            <ComingSoonCategoryCard key={cat.id} category={cat} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/coming-soon">
            <Button variant="secondary" size="md">
              View All Upcoming Highlights &rarr;
            </Button>
          </Link>
        </div>
      </section>

      {/* 7. INSTAGRAM SECTION */}
      <section className="bg-cream-100/60 border-y border-cream-300 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="font-script text-3xl text-rose-500 block">
            Follow along
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium mt-1">
            Moments on Instagram
          </h2>
          <p className="text-xs sm:text-sm text-espresso-600 mt-1 max-w-md mx-auto mb-8">
            More beautiful moments, behind the scenes and new creations.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            {[
              "/images/cakes/chocolate-belgium.jpg",
              "/images/bouquets/rose-bouquet.jpg",
              "/images/cakes/very-berry.jpg",
              "/images/bouquets/chocolate-bouquet.jpg",
              "/images/cakes/biscoff.jpg",
              "/images/bouquets/photo-bouquet.jpg",
            ].map((img, idx) => (
              <a
                key={idx}
                href={CONTACT_CONFIG.instagram.url}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square rounded-luxury overflow-hidden border border-cream-200 shadow-soft"
              >
                <img
                  src={img}
                  alt={`Instagram highlight ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-espresso-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <InstagramIcon className="w-6 h-6" />
                </div>
              </a>
            ))}
          </div>

          <a
            href={CONTACT_CONFIG.instagram.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-rose-600 hover:text-rose-700 bg-white border border-cream-300 hover:border-rose-300 px-6 py-2.5 rounded-full transition-colors shadow-soft"
          >
            <InstagramIcon className="w-4 h-4 text-rose-500" />
            <span>Follow {CONTACT_CONFIG.instagram.handle}</span>
          </a>
        </div>
      </section>

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
