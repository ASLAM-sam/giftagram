import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND_CONFIG, CONTACT_CONFIG } from '../config/brand';
import { Button } from '../components/common/Button';
import { Heart, Sparkles, ShieldCheck, ArrowRight, MapPin } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const AboutPage: React.FC = () => {
  useDocumentTitle(
    'About Giftagram | Luxury Gifting Studio',
    'Discover the story behind Giftagram—our artisanal baking standards, floral craftsmanship, and studio values.'
  );
  return (
    <div className="space-y-16 sm:space-y-24 py-10 sm:py-16 pb-20">
      {/* Editorial Hero Header */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="font-script text-4xl text-rose-500 block">
          Our Philosophy
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-espresso-900 font-medium tracking-tight">
          Thoughtfully made, <br />
          <span className="font-script text-5xl sm:text-6xl text-rose-500 lowercase">
            beautifully
          </span>{' '}
          gifted.
        </h1>
        <p className="text-base sm:text-lg text-espresso-700/90 max-w-2xl mx-auto font-light leading-relaxed pt-2">
          {BRAND_CONFIG.name} was born from a simple belief: the sweetest celebrations deserve genuine care, artisanal beauty, and an unforgettable touch of tenderness.
        </p>
      </section>

      {/* Visual & Quote Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-4/3 rounded-luxury-lg overflow-hidden border border-cream-300 shadow-card bg-cream-100">
            <img
              src="/images/cakes/chocolate-belgium.jpg"
              alt="Artisanal creation"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold bg-blush-100 px-3 py-1 rounded-full">
              Artisanal Craftsmanship
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium leading-snug">
              Every creation is made with care, from the smallest detail to the final wrapping.
            </h2>
            <p className="text-sm text-espresso-700 leading-relaxed font-light">
              We specialize in freshly baked 500-gram cakes crafted with pure chocolate couverture and seasonal fruits, paired with timeless red rose arrangements and bespoke photo keepsakes. Every element is prepared to order, ensuring each box leaves our kitchen feeling intensely personal.
            </p>
            <div className="pt-2">
              <Link to="/cakes">
                <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  Explore Our Menu
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFFDF9] rounded-luxury-lg border border-cream-300 p-8 sm:p-12 shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-blush-100 text-rose-500 flex items-center justify-center mx-auto md:mx-0">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso-900">
                Fresh to Order
              </h3>
              <p className="text-xs text-espresso-700 leading-relaxed">
                We never pre-bake or hold inventory on shelves. Every 500g cake and floral bouquet is made specifically for your chosen date and pickup slot.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-blush-100 text-rose-500 flex items-center justify-center mx-auto md:mx-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso-900">
                Personalized Lettering
              </h3>
              <p className="text-xs text-espresso-700 leading-relaxed">
                Whether celebrating birthdays, anniversaries, or tender spontaneous gestures, customize message lettering, delicate piping, and color themes.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-blush-100 text-rose-500 flex items-center justify-center mx-auto md:mx-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso-900">
                Clear & Transparent Care
              </h3>
              <p className="text-xs text-espresso-700 leading-relaxed">
                We maintain complete transparency with our 50% deposit policy, minimum 48-hour bakes, and upfront floral pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client Editable Story & Mission Placeholder Block */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-luxury border border-dashed border-rose-300/80 bg-blush-50/50 p-6 sm:p-8 text-center space-y-3">
          <span className="text-[0.68rem] uppercase tracking-widest text-rose-600 font-semibold bg-white border border-rose-200 px-3 py-1 rounded-full inline-block">
            Founder Story & Studio Notes
          </span>
          <h3 className="font-serif text-2xl text-espresso-900 font-medium">
            A Note from Our Studio
          </h3>
          <p className="text-xs text-espresso-700 max-w-xl mx-auto leading-relaxed">
            [Client story editable placeholder: Insert founder journey, kitchen inspiration, local community roots, and studio milestones here. All typography and editorial spacing are primed to receive your final brand story.]
          </p>
          <div className="pt-2 text-xs text-rose-600 flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Studio based in {CONTACT_CONFIG.pickup.cityStateZip}</span>
          </div>
        </div>
      </section>
    </div>
  );
};
