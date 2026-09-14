import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { BRAND_CONFIG, CONTACT_CONFIG } from '../../config/brand';
import { Logo } from '../common/Logo';
import { InstagramIcon } from '../common/InstagramIcon';
import {
  X,
  Phone,
  MessageCircle,
  User,
  Cake,
  Flower2,
  Sparkles,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';

export const MobileMenu: React.FC = () => {
  const { isMobileMenuOpen, closeMobileMenu, openAccount } = useUI();
  const location = useLocation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const prevPathRef = useRef(location.pathname);

  // Auto-close only when route actually changes
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      closeMobileMenu();
    }
  }, [location.pathname, closeMobileMenu]);

  // Lock body scroll when open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      // Focus close button on open for accessibility
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, closeMobileMenu]);

  const shopLinks = [
    {
      label: 'All Products',
      subtitle: 'Explore the complete atelier collection',
      href: '/shop',
      icon: <ShoppingBag className="w-4 h-4 text-rose-500" />,
    },
    {
      label: 'Artisanal Cakes',
      subtitle: '500g celebratory bakes & 50% deposit',
      href: '/cakes',
      icon: <Cake className="w-4 h-4 text-rose-500" />,
    },
    {
      label: 'Floral Bouquets',
      subtitle: 'Long-stem red roses & personalized wraps',
      href: '/bouquets',
      icon: <Flower2 className="w-4 h-4 text-rose-500" />,
    },
    {
      label: 'Coming Soon',
      subtitle: 'Cupcakes, Bento bakes & trousseau hampers',
      href: '/coming-soon',
      badge: 'Future',
      icon: <Sparkles className="w-4 h-4 text-champagne-600" />,
    },
  ];

  const categoryLinks = [
    { label: 'Cakes Collection', href: '/cakes', count: '4 Flavors' },
    { label: 'Rose Bouquets', href: '/bouquets', count: '10 to 50 Stems' },
  ];

  const studioLinks = [
    { label: 'Our Story & Heritage', href: '/about' },
    { label: 'Studio & Contact', href: '/contact' },
    { label: 'Deposit & Ordering Policy', href: '/refund-policy' },
  ];

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-espresso-900/50 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 left-0 w-[86%] max-w-sm bg-[#FFFDF9] shadow-modal border-r border-cream-300 flex flex-col justify-between z-10"
          >
            {/* Top Header */}
            <div className="p-5 border-b border-cream-200 flex items-center justify-between bg-white/60">
              <Logo />
              <button
                ref={closeButtonRef}
                onClick={closeMobileMenu}
                className="w-10 h-10 flex items-center justify-center text-espresso-700 hover:text-espresso-900 rounded-full hover:bg-cream-100 transition-colors cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
              {/* SECTION 1: SHOP */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-espresso-500">
                    Shop Collection
                  </span>
                </div>
                <div className="space-y-1">
                  {shopLinks.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-all min-h-[44px] ${
                          isActive
                            ? 'bg-rose-50 text-rose-700 font-medium'
                            : 'text-espresso-900 hover:bg-cream-100'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-cream-200/80 flex items-center justify-center shrink-0 shadow-xs">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-sm font-medium leading-none">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="text-[0.62rem] uppercase tracking-wider bg-champagne-100 text-champagne-800 px-1.5 py-0.5 rounded-full font-medium">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[0.68rem] text-espresso-600 mt-1 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-cream-400 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: CATEGORIES */}
              <div className="pt-2 border-t border-cream-200/80">
                <div className="mb-2 px-1">
                  <span className="text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-espresso-500">
                    Catalog Categories
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {categoryLinks.map((cat) => (
                    <Link
                      key={cat.href}
                      to={cat.href}
                      onClick={closeMobileMenu}
                      className="p-3 rounded-xl bg-white border border-cream-200 hover:border-rose-300 hover:shadow-xs transition-all text-left group"
                    >
                      <p className="font-serif text-xs font-semibold text-espresso-900 group-hover:text-rose-600 transition-colors">
                        {cat.label}
                      </p>
                      <p className="text-[0.65rem] text-espresso-500 mt-0.5 font-sans">
                        {cat.count}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* SECTION 3: ATELIER & STUDIO */}
              <div className="pt-2 border-t border-cream-200/80">
                <div className="mb-2 px-1">
                  <span className="text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-espresso-500">
                    Atelier & Information
                  </span>
                </div>
                <div className="space-y-0.5">
                  {studioLinks.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center justify-between py-2.5 px-2 rounded-lg text-xs transition-colors min-h-[44px] ${
                          isActive
                            ? 'text-rose-600 font-semibold bg-rose-50/60'
                            : 'text-espresso-700 hover:text-rose-600 hover:bg-cream-100/70'
                        }`}
                      >
                        <span className="font-medium">{item.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-cream-400" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: ACCOUNT & ORDER TRACKING */}
              <div className="pt-2 border-t border-cream-200/80">
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    openAccount();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-blush-50/90 hover:bg-blush-100 text-espresso-900 transition-colors border border-rose-200/80 min-h-[48px] cursor-pointer"
                  aria-label="Open my account and order tracking"
                >
                  <div className="w-8 h-8 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-soft shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-serif text-xs font-semibold leading-tight">My Account & Orders</p>
                    <p className="text-[0.68rem] text-espresso-600 mt-0.5">Track live commission & pickup status</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
                </button>
              </div>
            </div>

            {/* Bottom Info & Contact Channels */}
            <div className="p-5 border-t border-cream-200 bg-cream-50/80 space-y-3">
              <p className="font-serif italic text-xs text-espresso-700 text-center">
                &ldquo;{BRAND_CONFIG.tagline}&rdquo;
              </p>

              <div className="flex items-center justify-center gap-3 pt-1">
                <a
                  href={CONTACT_CONFIG.instagram.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-11 h-11 rounded-full bg-white border border-cream-300 flex items-center justify-center text-espresso-700 hover:text-rose-600 shadow-sm transition-colors cursor-pointer"
                  aria-label="Follow Giftagram on Instagram"
                  title="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a
                  href={CONTACT_CONFIG.whatsapp.chatUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-11 h-11 rounded-full bg-white border border-cream-300 flex items-center justify-center text-espresso-700 hover:text-rose-600 shadow-sm transition-colors cursor-pointer"
                  aria-label="Chat with Giftagram on WhatsApp"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a
                  href={CONTACT_CONFIG.phone.telUrl}
                  className="w-11 h-11 rounded-full bg-white border border-cream-300 flex items-center justify-center text-espresso-700 hover:text-rose-600 shadow-sm transition-colors cursor-pointer"
                  aria-label="Call Giftagram Studio"
                  title="Phone"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
