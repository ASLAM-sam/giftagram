import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { LogOut, ExternalLink, ShieldCheck, LayoutDashboard, Package, ShoppingBag } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2E1A16] selection:bg-rose-200 selection:text-espresso-900 font-sans">
      {/* Top Secure Admin Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Brand & Studio Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/admin" className="flex flex-col group">
              <span className="font-serif text-lg sm:text-xl tracking-[0.16em] uppercase font-medium text-espresso-900 group-hover:text-rose-600 transition-colors">
                GIFTAGRAM
              </span>
              <span className="font-sans text-[0.6rem] tracking-[0.22em] text-rose-500 uppercase font-medium -mt-0.5">
                Atelier Studio
              </span>
            </Link>
            <span className="hidden md:inline-block text-cream-400">/</span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs tracking-wider uppercase text-espresso-600 bg-cream-200/80 px-2.5 py-1 rounded-full border border-cream-300">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
              Admin
            </span>
          </div>

          {/* Atelier Navigation Tabs */}
          <div role="navigation" aria-label="Atelier Studio Navigation" className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-soft'
                    : 'text-espresso-700 hover:text-espresso-900 hover:bg-cream-200/80'
                }`
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Studio</span>
            </NavLink>
            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-soft'
                    : 'text-espresso-700 hover:text-espresso-900 hover:bg-cream-200/80'
                }`
              }
            >
              <Package className="w-3.5 h-3.5" />
              <span>Products</span>
            </NavLink>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-soft'
                    : 'text-espresso-700 hover:text-espresso-900 hover:bg-cream-200/80'
                }`
              }
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders</span>
            </NavLink>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* View Live Store */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-espresso-700 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-full hover:bg-cream-200"
              title="View customer storefront in a new tab"
            >
              <span>View Store</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Admin Badge */}
            {adminUser && (
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-medium text-espresso-900">
                  {adminUser.username}
                </span>
                <span className="text-[0.65rem] tracking-wider uppercase text-rose-600 font-medium">
                  {adminUser.role}
                </span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-espresso-800 hover:text-rose-600 hover:bg-cream-200/80 px-3 py-1.5 rounded-full border border-cream-300 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400/40"
              aria-label="Sign out of atelier"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>

      {/* Clean Admin Footer */}
      <footer className="border-t border-cream-300/70 py-6 text-center text-xs text-espresso-600">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Giftagram Atelier • Secure Admin Workspace</span>
          <span className="text-[0.7rem] text-cream-400">Phase 1: Authentication Verified</span>
        </div>
      </footer>
    </div>
  );
};
