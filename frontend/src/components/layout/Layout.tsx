import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileMenu } from './MobileMenu';
import { CartDrawer } from '../cart/CartDrawer';
import { SearchModal } from '../search/SearchModal';
import { ToastContainer } from '../common/ToastContainer';

import { AccountDrawer } from '../account/AccountDrawer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2E1A16] selection:bg-rose-200 selection:text-espresso-900">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />

      {/* Global Drawers, Modals and Overlays */}
      <MobileMenu />
      <CartDrawer />
      <SearchModal />
      <AccountDrawer />
      <ToastContainer />
    </div>
  );
};
