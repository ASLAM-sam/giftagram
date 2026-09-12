import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { MAIN_NAV_LINKS } from '../../config/navigation';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useUI } from '../../context/UIContext';
import { Search, ShoppingBag, Heart, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { itemCount, openDrawer } = useCart();
  const { wishlistCount } = useWishlist();
  const { openSearch, openMobileMenu } = useUI();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#FFFDF9]/95 backdrop-blur-md shadow-soft py-3 border-b border-cream-200'
          : 'bg-[#FAF7F2]/90 backdrop-blur-sm py-4 border-b border-cream-200/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center shrink-0">
          <Logo />
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7">
          {MAIN_NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`relative text-sm tracking-wide transition-colors py-1 ${
                  isActive
                    ? 'text-rose-600 font-medium'
                    : 'text-espresso-800 hover:text-rose-600 font-normal'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="ml-1.5 text-[0.62rem] uppercase tracking-wider bg-blush-100 text-rose-600 px-1.5 py-0.5 rounded-full font-medium">
                    {link.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions (Search, Wishlist, Cart, Mobile Hamburger) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Search Icon */}
          <button
            onClick={openSearch}
            className="p-2 text-espresso-800 hover:text-rose-600 rounded-full hover:bg-cream-100/70 transition-colors"
            aria-label="Search products"
          >
            <Search className="w-5 h-5 stroke-[1.75]" />
          </button>

          {/* Wishlist Link with count */}
          <Link
            to="/wishlist"
            className="p-2 text-espresso-800 hover:text-rose-600 rounded-full hover:bg-cream-100/70 transition-colors relative"
            aria-label={`Wishlist (${wishlistCount} items)`}
          >
            <Heart className="w-5 h-5 stroke-[1.75]" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[0.65rem] font-medium rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon with count */}
          <button
            onClick={openDrawer}
            className="p-2 text-espresso-800 hover:text-rose-600 rounded-full hover:bg-cream-100/70 transition-colors relative flex items-center gap-1"
            aria-label={`Shopping basket with ${itemCount} items`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[0.65rem] font-semibold rounded-full flex items-center justify-center animate-pulse">
                  {itemCount}
                </span>
              )}
            </div>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={openMobileMenu}
            className="lg:hidden p-2 text-espresso-800 hover:text-rose-600 rounded-full hover:bg-cream-100/70 transition-colors ml-1"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-6 h-6 stroke-[1.75]" />
          </button>
        </div>
      </div>
    </header>
  );
};
