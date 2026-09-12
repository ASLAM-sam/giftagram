import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { UIProvider } from './context/UIContext';
import { Layout } from './components/layout/Layout';

// Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { CakesPage } from './pages/CakesPage';
import { BouquetsPage } from './pages/BouquetsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { WishlistPage } from './pages/WishlistPage';
import { RefundPolicyPage, PrivacyPolicyPage, TermsPage } from './pages/PolicyPages';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <CartProvider>
        <WishlistProvider>
          <UIProvider>
            <Layout>
              <Routes>
                {/* Core Store Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/cakes" element={<CakesPage />} />
                <Route path="/bouquets" element={<BouquetsPage />} />
                
                {/* Product Detail Routes */}
                <Route path="/cakes/:slug" element={<ProductDetailPage />} />
                <Route path="/bouquets/:slug" element={<ProductDetailPage />} />
                <Route path="/product/:slug" element={<ProductDetailPage />} />

                {/* Cart & Checkout Routes */}
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />

                {/* Brand & Editorial Routes */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/coming-soon" element={<ComingSoonPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />

                {/* Policies & Deposit Information */}
                <Route path="/refund-policy" element={<RefundPolicyPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </UIProvider>
        </WishlistProvider>
      </CartProvider>
    </BrowserRouter>
  );
};

export default App;
