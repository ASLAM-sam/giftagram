import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button } from '../../components/common/Button';

export const AdminLoginPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to /admin (or intended destination)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const destination = (location.state as any)?.from?.pathname || '/admin';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMessage('Admin username is required.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(trimmedUsername, password);
      // Navigate to /admin or requested route
      const destination = (location.state as any)?.from?.pathname || '/admin';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between items-center px-4 py-8 sm:py-12 selection:bg-rose-200 selection:text-espresso-900 text-[#2E1A16] font-sans">
      {/* Top Bar / Back Link */}
      <div className="w-full max-w-md flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-espresso-700 hover:text-rose-600 transition-colors py-2 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Return to boutique store</span>
        </Link>
        <span className="text-[0.65rem] tracking-wider uppercase text-espresso-600 font-medium bg-cream-200/90 px-2.5 py-1 rounded-full border border-cream-300">
          Secure Portal
        </span>
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md my-auto"
      >
        <div className="bg-[#FFFDF9] border border-cream-300/90 rounded-2xl shadow-card p-6 sm:p-9 relative overflow-hidden">
          {/* Subtle top rose accent hairline */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-300 via-rose-500 to-rose-300" />

          {/* Header Brand Section */}
          <div className="text-center mb-8">
            <span className="font-serif text-2xl sm:text-3xl tracking-[0.18em] uppercase font-medium text-espresso-900 block">
              GIFTAGRAM
            </span>
            <span className="font-sans text-[0.65rem] tracking-[0.25em] text-rose-500 uppercase font-medium block mt-0.5">
              Atelier Studio
            </span>

            <div className="w-12 h-px bg-cream-300 mx-auto my-4" />

            <span className="text-xs tracking-[0.2em] uppercase font-medium text-espresso-600 block">
              ADMIN ACCESS
            </span>
            <h1 className="font-serif text-xl sm:text-2xl text-espresso-900 mt-1 font-normal">
              Welcome back
            </h1>
            <p className="text-xs text-espresso-700 mt-1">
              Sign in to continue to your Giftagram studio.
            </p>
          </div>

          {/* Error Message Alert */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 rounded-xl bg-blush-100/90 border border-blush-300 flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Username Field */}
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-medium uppercase tracking-wider text-espresso-800 mb-1.5"
              >
                Admin username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-espresso-600">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. giftstudio"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-espresso-900 placeholder:text-cream-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium uppercase tracking-wider text-espresso-800 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-espresso-600">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-espresso-900 placeholder:text-cream-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-espresso-600 hover:text-espresso-900 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>

          {/* Card Micro Footer */}
          <div className="mt-7 pt-5 border-t border-cream-200 text-center">
            <span className="text-[0.7rem] text-espresso-600 tracking-wide">
              Giftagram Atelier • Secure Admin Access
            </span>
          </div>
        </div>
      </motion.div>

      {/* Outer Footer */}
      <div className="w-full max-w-md text-center py-2">
        <p className="text-[0.7rem] text-cream-400 tracking-wider">
          © {new Date().getFullYear()} GIFTAGRAM ATELIER. All rights reserved.
        </p>
      </div>
    </div>
  );
};
