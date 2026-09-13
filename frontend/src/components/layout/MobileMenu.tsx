import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { MAIN_NAV_LINKS } from '../../config/navigation';
import { BRAND_CONFIG, CONTACT_CONFIG } from '../../config/brand';
import { Logo } from '../common/Logo';
import { InstagramIcon } from '../common/InstagramIcon';
import { X, Phone, MessageCircle, User } from 'lucide-react';

export const MobileMenu: React.FC = () => {
  const { isMobileMenuOpen, closeMobileMenu, openAccount } = useUI();
  const location = useLocation();

  // Auto-close on route change
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-espresso-900/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 left-0 w-[82%] max-w-sm bg-[#FFFDF9] shadow-modal border-r border-cream-300 flex flex-col justify-between z-10"
          >
            {/* Top header */}
            <div className="p-6 border-b border-cream-200 flex items-center justify-between">
              <Logo />
              <button
                onClick={closeMobileMenu}
                className="p-2 text-espresso-700 hover:text-espresso-900 rounded-full hover:bg-cream-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-1">
              {MAIN_NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center justify-between py-3.5 border-b border-cream-100 text-lg font-serif transition-colors ${
                      isActive
                        ? 'text-rose-600 font-semibold pl-2 border-l-2 border-rose-500'
                        : 'text-espresso-900 hover:text-rose-600 font-normal'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-[0.65rem] uppercase tracking-wider bg-blush-100 text-rose-600 px-2 py-0.5 rounded-full font-sans font-medium">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Account & Order Tracking in Mobile Menu */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    closeMobileMenu();
                    openAccount();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-luxury bg-blush-50/80 hover:bg-blush-100 text-espresso-900 transition-colors border border-rose-200/70"
                >
                  <div className="w-8 h-8 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-soft shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-serif text-sm font-semibold leading-none">My Account & Orders</p>
                    <p className="text-[0.68rem] text-espresso-600 mt-1">Track order status & studio pickup</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom info & socials */}
            <div className="p-6 border-t border-cream-200 bg-cream-50/70 space-y-4">
              <p className="font-serif italic text-xs text-espresso-700 text-center">
                "{BRAND_CONFIG.tagline}"
              </p>
              
              <div className="flex items-center justify-center gap-4 pt-1">
                <a
                  href={CONTACT_CONFIG.instagram.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white border border-cream-300 flex items-center justify-center text-espresso-700 hover:text-rose-600 shadow-sm"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a
                  href={CONTACT_CONFIG.whatsapp.chatUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white border border-cream-300 flex items-center justify-center text-espresso-700 hover:text-rose-600 shadow-sm"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a
                  href={CONTACT_CONFIG.phone.telUrl}
                  className="w-10 h-10 rounded-full bg-white border border-cream-300 flex items-center justify-center text-espresso-700 hover:text-rose-600 shadow-sm"
                  aria-label="Phone"
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
