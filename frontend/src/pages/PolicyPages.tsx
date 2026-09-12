import React from 'react';
import { BRAND_CONFIG, CONTACT_CONFIG } from '../config/brand';
import { ShieldCheck, Calendar, Clock, AlertCircle } from 'lucide-react';

export const RefundPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="text-center space-y-2 border-b border-cream-200 pb-6">
        <span className="font-script text-3xl text-rose-500 block">
          Order Guidelines
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium">
          Refund & 50% Deposit Policy
        </h1>
        <p className="text-xs text-espresso-600">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-espresso-800 leading-relaxed">
        {/* Core 50% deposit callout */}
        <div className="p-5 rounded-luxury-lg bg-blush-50 border border-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-rose-600 text-base">
            <ShieldCheck className="w-5 h-5 text-rose-500 shrink-0" />
            <span>50% Non-Refundable Deposit Mandate</span>
          </div>
          <p className="text-espresso-800 leading-relaxed">
            Due to the artisanal, made-to-order nature of our cakes and floral arrangements, <strong className="text-espresso-900">a 50% deposit is strictly non-refundable</strong> once paid. This deposit immediately reserves your kitchen bake slot, locks in fresh floral procurement, and covers preliminary prep work.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-medium text-espresso-900">
            1. How to Place an Order
          </h2>
          <p>
            When placing a custom cake or bouquet order through {BRAND_CONFIG.name}, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-espresso-700">
            <li>Your full name, telephone/WhatsApp contact, and receipt email.</li>
            <li>Your chosen pickup date and scheduled time window (minimum 48 hours notice required).</li>
            <li>Detailed descriptions including preferred color palette, piping theme, and exact cake lettering (up to 30 characters).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-medium text-espresso-900">
            2. Payment Breakdown
          </h2>
          <p>
            The order total is divided into two transparent installments:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-espresso-700">
            <li><strong>50% Initial Deposit:</strong> Paid at checkout to initiate your order.</li>
            <li><strong>50% Remaining Balance:</strong> Payable upon studio collection via UPI, card, or cash.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-medium text-espresso-900">
            3. Rescheduling & Adjustments
          </h2>
          <p>
            We understand that event timelines can change. Date shifts may be accommodated if requested at least 48 hours prior to your scheduled pickup time, subject to studio capacity. Adjustments to lettering messages must be submitted at least 24 hours prior to baking.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-medium text-espresso-900">
            4. Floral Variations
          </h2>
          <p>
            As noted on our Bouquets menu:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-espresso-700">
            <li>Theme and wrapping charges may vary based on custom ribbon and paper styling.</li>
            <li>Listed bouquet prices are based on premium grade fresh red roses.</li>
            <li>Additional charges apply for adding gypsy (baby's breath) or exotic greenery.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-2 border-t border-cream-200">
          <h2 className="font-serif text-lg font-medium text-espresso-900">
            Studio Support
          </h2>
          <p>
            Have questions regarding your order? Reach our team directly at{' '}
            <a href={CONTACT_CONFIG.whatsapp.chatUrl} className="text-rose-600 underline">
              WhatsApp ({CONTACT_CONFIG.whatsapp.displayNumber})
            </a>{' '}
            or email us at{' '}
            <a href={CONTACT_CONFIG.email.mailtoUrl} className="text-rose-600 underline">
              {CONTACT_CONFIG.email.address}
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6">
      <div className="text-center space-y-2 border-b border-cream-200 pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium">
          Privacy Policy
        </h1>
        <p className="text-xs text-espresso-600">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm text-espresso-800 leading-relaxed">
        <p>
          At {BRAND_CONFIG.name}, we value your privacy. This policy outlines how we handle your personal data when you browse our boutique and submit custom order inquiries.
        </p>
        <h3 className="font-serif text-lg font-medium text-espresso-900 pt-2">
          Information We Collect
        </h3>
        <p>
          We only collect information necessary to fulfill custom bakery and bouquet orders, including recipient names, WhatsApp numbers, pickup schedules, and cake messaging instructions.
        </p>
        <h3 className="font-serif text-lg font-medium text-espresso-900 pt-2">
          Data Security
        </h3>
        <p>
          We never sell or rent your contact details to third parties. All payment sessions are handled through encrypted, secure payment gateway integrations.
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6">
      <div className="text-center space-y-2 border-b border-cream-200 pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium">
          Terms of Service
        </h1>
        <p className="text-xs text-espresso-600">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm text-espresso-800 leading-relaxed">
        <p>
          By placing an order on {BRAND_CONFIG.name}, you agree to our studio terms, including the mandatory 50% non-refundable deposit for all custom orders and the 48-hour advance notice requirement for custom baked creations.
        </p>
        <p>
          Products must be collected from our studio location during your selected pickup time slot. Uncollected orders will be held for a maximum of 24 hours under refrigeration before disposal.
        </p>
      </div>
    </div>
  );
};
