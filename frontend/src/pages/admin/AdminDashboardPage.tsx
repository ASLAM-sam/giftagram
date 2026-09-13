import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, UserCheck, Sparkles, LogOut, Package, ShoppingBag } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const displayName = adminUser?.fullName || 'Giftagram Atelier Admin';
  const username = adminUser?.username || 'giftstudio';
  const role = adminUser?.role === 'admin' ? 'Administrator' : adminUser?.role || 'Administrator';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-8"
    >
      {/* 1. Grand Atelier Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFFDF9] via-cream-50 to-blush-50/70 border border-cream-300/90 shadow-card p-6 sm:p-10 lg:p-12">
        {/* Subtle decorative background watermark */}
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-[0.03] select-none pointer-events-none font-serif text-[18rem] text-espresso-900 leading-none">
          G
        </div>

        <div className="relative z-10 max-w-2xl">
          {/* Top Brand Pill & Live Auth Status */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
            <span className="inline-flex items-center gap-1 text-[0.65rem] sm:text-xs tracking-[0.2em] uppercase font-semibold text-rose-600 bg-rose-100/70 border border-rose-200/80 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-rose-500" />
              Giftagram Atelier
            </span>
            <span className="inline-flex items-center gap-1.5 text-[0.65rem] sm:text-xs tracking-wider uppercase font-medium text-emerald-700 bg-emerald-50/80 border border-emerald-200/70 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Securely Authenticated
            </span>
          </div>

          {/* Warm Luxury Greeting */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-espresso-900 font-normal tracking-tight leading-tight">
            Welcome to Giftagram
          </h1>
          <h2 className="font-serif text-xl sm:text-2xl text-rose-600/90 mt-1.5 font-normal">
            Welcome back, {displayName}
          </h2>

          <p className="text-sm sm:text-base text-espresso-700 mt-4 leading-relaxed font-sans">
            Your atelier is ready. Manage your products, artisanal creations, and customer orders from this dedicated workspace.
          </p>

          <div className="mt-6 pt-5 border-t border-cream-200/80 flex flex-wrap items-center gap-4 text-xs text-espresso-700">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-rose-500" />
              <span>Signed in as <strong className="text-espresso-900 font-semibold">{username}</strong></span>
            </div>
            <span className="text-cream-400">•</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Role: <strong className="text-espresso-900 font-semibold">{role}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Session & Authentication Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Administrator Profile Card */}
        <div className="bg-[#FFFDF9] border border-cream-300/80 rounded-xl p-5 sm:p-6 shadow-soft flex flex-col justify-between">
          <div>
            <span className="text-[0.65rem] tracking-[0.2em] uppercase font-semibold text-espresso-600 block mb-2">
              ADMINISTRATOR
            </span>
            <h3 className="text-base font-semibold text-espresso-900">
              {displayName}
            </h3>
            <p className="text-xs text-espresso-700 mt-1">
              Username: <code className="bg-cream-200/80 px-1.5 py-0.5 rounded text-rose-700 font-mono text-[0.8rem]">{username}</code>
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-cream-200/60 flex items-center justify-between text-xs">
            <span className="text-espresso-600">Access Level</span>
            <span className="font-medium text-rose-600 bg-blush-100/80 px-2 py-0.5 rounded-full text-[0.7rem] uppercase tracking-wider">
              {role}
            </span>
          </div>
        </div>

        {/* Security / Cookie Session Card */}
        <div className="bg-[#FFFDF9] border border-cream-300/80 rounded-xl p-5 sm:p-6 shadow-soft flex flex-col justify-between">
          <div>
            <span className="text-[0.65rem] tracking-[0.2em] uppercase font-semibold text-espresso-600 block mb-2">
              SESSION STATE
            </span>
            <h3 className="text-base font-semibold text-espresso-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              HttpOnly Secure Cookie
            </h3>
            <p className="text-xs text-espresso-700 mt-1">
              Cookie: <code className="bg-cream-200/80 px-1.5 py-0.5 rounded text-espresso-800 font-mono text-[0.75rem]">giftagram_admin_session</code>
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-cream-200/60 flex items-center justify-between text-xs">
            <span className="text-espresso-600">Validity</span>
            <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[0.7rem] uppercase tracking-wider">
              7 Days Active
            </span>
          </div>
        </div>

        {/* Active Workspace / Actions Card */}
        <div className="bg-[#FFFDF9] border border-cream-300/80 rounded-xl p-5 sm:p-6 shadow-soft flex flex-col justify-between">
          <div>
            <span className="text-[0.65rem] tracking-[0.2em] uppercase font-semibold text-espresso-600 block mb-2">
              ADMIN CONTROL
            </span>
            <h3 className="text-base font-semibold text-espresso-900">
              Session Management
            </h3>
            <p className="text-xs text-espresso-700 mt-1">
              End your administrative session securely at any time.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-cream-200/60 flex items-center justify-between">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 text-xs font-medium text-rose-700 bg-blush-100/70 hover:bg-blush-200/80 border border-blush-300 px-3.5 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out of studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Future-Ready Atelier Modules (Clean, honest informational preview without fake metrics) */}
      <div className="bg-[#FFFDF9] border border-cream-300/80 rounded-2xl p-6 sm:p-8 shadow-soft">
        <div className="max-w-xl">
          <span className="text-[0.65rem] tracking-[0.2em] uppercase font-semibold text-rose-600 block mb-1">
            ATELIER PIPELINE
          </span>
          <h3 className="font-serif text-xl sm:text-2xl text-espresso-900 font-normal">
            Your studio is ready
          </h3>
          <p className="text-xs sm:text-sm text-espresso-700 mt-2 leading-relaxed">
            Phase 1 authentication has established your secure administrator session. The forthcoming studio modules will appear here:
          </p>
        </div>        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
          {/* Active Phase 2 & 3: Product & Image Management */}
          <div className="rounded-xl border border-cream-300/90 bg-white p-5 sm:p-6 flex flex-col justify-between shadow-soft hover:shadow-card transition-all group">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-[0.65rem] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live Atelier
                </span>
              </div>
              <h4 className="text-base font-semibold text-espresso-900">Product & Media Studio</h4>
              <p className="text-xs text-espresso-600 mt-1.5 leading-relaxed">
                Catalog oversight, atelier pricing, active availability, handcrafted cake specifications, and secure Cloudinary image management.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-cream-200/60">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-rose-600 hover:text-white bg-blush-50 hover:bg-rose-500 border border-rose-200/80 hover:border-transparent py-2.5 px-3 rounded-lg transition-all cursor-pointer"
              >
                <span>Manage Products & Images</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>

          {/* Active Phase 4: Order Management */}
          <div className="rounded-xl border border-cream-300/90 bg-white p-5 sm:p-6 flex flex-col justify-between shadow-soft hover:shadow-card transition-all group">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-[0.65rem] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live Atelier
                </span>
              </div>
              <h4 className="text-base font-semibold text-espresso-900">Order Ledger & Fulfillment</h4>
              <p className="text-xs text-espresso-600 mt-1.5 leading-relaxed">
                Real-time order tracking, frozen price snapshots, bespoke cake customization notes, 50% non-refundable deposit auditing, and status lifecycle.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-cream-200/60">
              <button
                type="button"
                onClick={() => navigate('/admin/orders')}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-amber-800 hover:text-white bg-amber-50 hover:bg-amber-600 border border-amber-200/80 hover:border-transparent py-2.5 px-3 rounded-lg transition-all cursor-pointer"
              >
                <span>Manage Customer Orders</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
