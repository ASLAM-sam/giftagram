import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { motion } from 'framer-motion';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-[#2E1A16]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          {/* Brand Mark */}
          <div className="mb-4">
            <span className="font-serif text-2xl tracking-[0.2em] uppercase font-medium text-espresso-900 block">
              GIFTAGRAM
            </span>
            <span className="font-sans text-[0.65rem] tracking-[0.25em] text-rose-500 uppercase font-medium block mt-0.5">
              Atelier Studio
            </span>
          </div>

          {/* Minimal Luxury Spinner */}
          <div className="relative w-10 h-10 my-4">
            <div className="absolute inset-0 rounded-full border-2 border-cream-300" />
            <div className="absolute inset-0 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          </div>

          <p className="font-sans text-xs tracking-wider text-espresso-700 uppercase mt-2">
            Verifying Atelier Session...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving intended path in location state
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
