/**
 * Cloudflare Worker Environment Bindings & Secrets
 */

export interface Env {
  // Cloudflare D1 Database Binding
  DB: D1Database;


  // Razorpay Server Secrets (Configured via Cloudflare Worker Secrets)
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET?: string;

  // Cloudinary Secrets
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;

  // Application Environment & Domain Configurations
  ENVIRONMENT?: 'development' | 'staging' | 'production';
  CORS_ORIGINS?: string; // Comma-separated allowed origins
  FRONTEND_URL?: string;
}
