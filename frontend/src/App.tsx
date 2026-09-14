import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { UIProvider } from './context/UIContext';
import { Layout } from './components/layout/Layout';

// Admin Components & Pages (Completely isolated from customer Layout)
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';

// Customer Pages
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
      <AdminAuthProvider>
        <CartProvider>
          <WishlistProvider>
            <UIProvider>
              <Routes>
                {/* 1. Admin Routes (Completely Isolated from Customer Layout) */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminLayout>
                        <AdminDashboardPage />
                      </AdminLayout>
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <AdminProtectedRoute>
                      <AdminLayout>
                        <AdminProductsPage />
                      </AdminLayout>
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <AdminProtectedRoute>
                      <AdminLayout>
                        <AdminOrdersPage />
                      </AdminLayout>
                    </AdminProtectedRoute>
                  }
                />

                {/* 2. Customer Storefront Routes (Wrapped in Customer Layout) */}
                <Route
                  path="/*"
                  element={
                    <Layout>
                      <Routes>
                        {/* Core Store Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/shop" element={<ShopPage />} />
                        <Route path="/category/:category" element={<ShopPage />} />
                        <Route path="/cakes" element={<CakesPage />} />
                        <Route path="/bouquets" element={<BouquetsPage />} />
                        
                        {/* Product Detail Routes */}
                        <Route path="/cakes/:slug" element={<ProductDetailPage />} />
                        <Route path="/bouquets/:slug" element={<ProductDetailPage />} />
                        <Route path="/product/:slug" element={<ProductDetailPage />} />
                        <Route path="/products/:slug" element={<ProductDetailPage />} />
                        <Route path="/category/:category/:slug" element={<ProductDetailPage />} />

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
                        
                        {/* Generic category product slug for any admin-created categories */}
                        <Route path="/:category/:slug" element={<ProductDetailPage />} />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                  }
                />
              </Routes>
            </UIProvider>
          </WishlistProvider>
        </CartProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
};

export default App;
