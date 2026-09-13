/**
 * Frontend Environment Configuration
 * 
 * Safely accesses Vite public environment variables with resilient fallbacks.
 * NOTE: Sensitive keys like RAZORPAY_KEY_SECRET must NEVER be in frontend code.
 */

export const ENV = {
  // Cloudflare Worker API URL
  API_URL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://giftagram-backend.hydpurefumes.workers.dev' : 'http://localhost:8787'),

  // Razorpay Public Key ID (Safe to expose in browser)
  // For production/test mode: set VITE_RAZORPAY_KEY_ID in Cloudflare Pages / .env
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_giftagram_mock',

  // Cloudflare R2 Public CDN / Custom Domain for images
  R2_PUBLIC_URL: import.meta.env.VITE_R2_PUBLIC_URL || '',

  // Environment mode
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};
