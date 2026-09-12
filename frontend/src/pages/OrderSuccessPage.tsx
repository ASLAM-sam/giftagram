import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { Button } from '../components/common/Button';
import { CONTACT_CONFIG, BRAND_CONFIG } from '../config/brand';
import { CheckCircle2, Calendar, Clock, MapPin, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || 'GFT-2026-RECENT';
  const order = orderService.getOrderById(orderId);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-10 text-center">
      {/* Success Badge & Headline */}
      <div className="space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-blush-100 border border-rose-200 flex items-center justify-center text-rose-500 shadow-soft">
          <CheckCircle2 className="w-10 h-10 stroke-[1.75]" />
        </div>

        <span className="font-script text-4xl text-rose-500 block">
          Thank you with all our heart
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-espresso-900 font-medium tracking-tight">
          Your order is on its way to becoming something beautiful.
        </h1>

        <p className="text-sm text-espresso-700 max-w-lg mx-auto font-light leading-relaxed">
          We have reserved your bake schedule and sent a receipt confirmation to your details. Our studio chef is excited to prepare your creation.
        </p>
      </div>

      {/* Order Reference Card */}
      <div className="bg-[#FFFDF9] rounded-luxury-lg border border-cream-300 p-6 sm:p-8 text-left space-y-6 shadow-card">
        {/* Top order meta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cream-200 pb-4">
          <div>
            <span className="text-[0.68rem] tracking-widest uppercase font-semibold text-espresso-600">
              Order Reference
            </span>
            <p className="font-serif text-2xl text-rose-600 font-semibold mt-0.5">
              {orderId}
            </p>
          </div>
          <div className="sm:text-right">
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium border border-emerald-200">
              <Sparkles className="w-3 h-3" />
              50% Deposit Confirmed
            </span>
          </div>
        </div>

        {/* Pickup scheduling details */}
        {order && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-espresso-800 bg-cream-50/70 p-4 rounded-luxury border border-cream-200">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-espresso-900">Pickup Date</p>
                <p className="text-espresso-700">{order.customer.pickupDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-espresso-900">Scheduled Time Window</p>
                <p className="text-espresso-700">{order.customer.pickupTime}</p>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-start gap-2.5 pt-2 border-t border-cream-200/80">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-espresso-900">{CONTACT_CONFIG.pickup.studioName}</p>
                <p className="text-espresso-600">{CONTACT_CONFIG.pickup.addressLine1}, {CONTACT_CONFIG.pickup.addressLine2}</p>
              </div>
            </div>
          </div>
        )}

        {/* Financial summary breakdown */}
        {order && (
          <div className="space-y-2 text-xs text-espresso-800 border-t border-cream-200 pt-4">
            <div className="flex justify-between">
              <span>Order Subtotal</span>
              <span className="font-medium text-espresso-900">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-semibold">
              <span>50% Non-Refundable Deposit Received</span>
              <span>₹{order.depositRequired}</span>
            </div>
            <div className="flex justify-between text-espresso-600 pt-1 border-t border-cream-200">
              <span>Remaining Balance (Due upon studio pickup)</span>
              <span className="font-medium text-espresso-900">₹{order.balanceDueOnPickup}</span>
            </div>
          </div>
        )}

        {/* WhatsApp assistance */}
        <div className="p-4 rounded-luxury bg-blush-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-espresso-900">Need to make adjustments to your lettering?</p>
            <p className="text-espresso-600">Connect directly with our bakery artist via WhatsApp.</p>
          </div>
          <a
            href={CONTACT_CONFIG.whatsapp.chatUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-rose-200 text-rose-600 font-medium hover:bg-rose-50 transition-colors shrink-0 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-2 flex justify-center gap-4">
        <Link to="/shop">
          <Button variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
            Continue Shopping
          </Button>
        </Link>
        <Link to="/">
          <Button variant="secondary" size="lg">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
