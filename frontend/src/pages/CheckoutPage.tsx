import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { CONTACT_CONFIG, BRAND_CONFIG } from '../config/brand';
import { Button } from '../components/common/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Lock,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  useDocumentTitle(
    'Order & Pickup Checkout | Giftagram',
    'Confirm your order and reserve your bake schedule with a 50% non-refundable deposit.'
  );

  const { items, subtotal, depositRequired, balanceDue, clearCart } = useCart();
  const { showToast } = useUI();
  const navigate = useNavigate();

  // Minimum date: 2 days from today
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);
  const minDateStr = minDate.toISOString().split('T')[0];

  const [customer, setCustomer] = useState({
    fullName: items[0]?.customization?.fullName || '',
    phone: items[0]?.customization?.phoneNumber || '',
    email: items[0]?.customization?.email || '',
    pickupDate: items[0]?.customization?.pickupDate || minDateStr,
    pickupTime: items[0]?.customization?.pickupTime || '14:00',
    specialInstructions: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-3xl text-espresso-900 font-medium">
          Your basket is empty.
        </h2>
        <p className="text-sm text-espresso-600">
          Please add items to your basket before proceeding to checkout.
        </p>
        <Link to="/shop">
          <Button variant="primary" size="md">
            Browse Menu
          </Button>
        </Link>
      </div>
    );
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!customer.fullName.trim()) errs.fullName = 'Full name is required';
    if (!customer.phone.trim() || customer.phone.length < 10) {
      errs.phone = 'Valid 10-digit phone number is required';
    }
    if (!customer.pickupDate) errs.pickupDate = 'Pickup date is required';
    if (!customer.pickupTime) errs.pickupTime = 'Pickup time window is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fill all mandatory contact and pickup details', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create order record on Cloudflare Workers + D1
      const orderRes = await orderService.createOrder({
        customer,
        items,
        subtotal,
        depositRequired,
      });

      const displayOrderNumber = orderRes.orderNumber || orderRes.orderId;

      // 2. Process deposit payment via Razorpay Standard Checkout
      const paymentRes = await paymentService.processDepositPayment(
        orderRes.orderId,
        displayOrderNumber,
        depositRequired,
        customer.fullName,
        customer.phone,
        customer.email
      );

      // 3. Clear cart and redirect to order success confirmation
      if (paymentRes.success) {
        clearCart();
        showToast('50% deposit confirmed and bake reserved!', 'success');
        navigate(`/order-success?orderId=${displayOrderNumber}`);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred while processing order. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="font-script text-3xl text-rose-500 block">
          Finalizing your celebration
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium">
          Order & Pickup Checkout
        </h1>
        <p className="text-xs sm:text-sm text-espresso-600 font-light">
          A 50% non-refundable deposit secures your date. The remaining balance is payable upon pickup.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Form: Customer & Pickup Details */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Customer Details */}
          <div className="bg-[#FFFDF9] rounded-luxury-lg border border-cream-300 p-6 space-y-4 shadow-soft">
            <h3 className="font-serif text-xl font-medium text-espresso-900 border-b border-cream-200 pb-3">
              1. Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-espresso-800 font-medium mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customer.fullName}
                  onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                  placeholder="e.g. Alisha Sharma"
                  className={`w-full bg-white border rounded-lg px-3 py-2.5 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 ${
                    errors.fullName ? 'border-rose-500' : 'border-cream-300'
                  }`}
                />
                {errors.fullName && <p className="text-rose-600 text-[0.7rem] mt-0.5">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-espresso-800 font-medium mb-1">
                  Phone Number (WhatsApp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="e.g. 8141376677"
                  className={`w-full bg-white border rounded-lg px-3 py-2.5 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 ${
                    errors.phone ? 'border-rose-500' : 'border-cream-300'
                  }`}
                />
                {errors.phone && <p className="text-rose-600 text-[0.7rem] mt-0.5">{errors.phone}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-espresso-800 font-medium mb-1">
                  Email Address <span className="text-espresso-600/70 font-normal">(For order confirmation receipt)</span>
                </label>
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  placeholder="alisha@example.com"
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2.5 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Studio Pickup Schedule */}
          <div className="bg-[#FFFDF9] rounded-luxury-lg border border-cream-300 p-6 space-y-4 shadow-soft">
            <h3 className="font-serif text-xl font-medium text-espresso-900 border-b border-cream-200 pb-3">
              2. Pickup Scheduling
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-espresso-800 font-medium mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  Pickup Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={minDateStr}
                  value={customer.pickupDate}
                  onChange={(e) => setCustomer({ ...customer, pickupDate: e.target.value })}
                  className={`w-full bg-white border rounded-lg px-3 py-2.5 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 ${
                    errors.pickupDate ? 'border-rose-500' : 'border-cream-300'
                  }`}
                />
                <p className="text-[0.68rem] text-espresso-600 mt-1">Orders require minimum 48h advance notice</p>
              </div>

              <div>
                <label className="block text-espresso-800 font-medium mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  Pickup Time Slot <span className="text-rose-500">*</span>
                </label>
                <select
                  value={customer.pickupTime}
                  onChange={(e) => setCustomer({ ...customer, pickupTime: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2.5 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                >
                  <option value="12:00">12:00 PM — 02:00 PM</option>
                  <option value="14:00">02:00 PM — 04:00 PM</option>
                  <option value="16:00">04:00 PM — 06:00 PM</option>
                  <option value="18:00">06:00 PM — 08:00 PM</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-espresso-800 font-medium mb-1">
                  Special Instructions or Gifting Notes
                </label>
                <textarea
                  rows={2}
                  value={customer.specialInstructions}
                  onChange={(e) => setCustomer({ ...customer, specialInstructions: e.target.value })}
                  placeholder="Any pickup notes, packaging requests, or timing preferences..."
                  className="w-full bg-white border border-cream-300 rounded-lg p-3 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                />
              </div>
            </div>

            {/* Pickup Studio Address info */}
            <div className="mt-2 p-3.5 rounded-luxury bg-cream-100/70 border border-cream-300/80 flex items-start gap-3 text-xs text-espresso-800">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-espresso-900">{CONTACT_CONFIG.pickup.studioName}</p>
                <p className="text-espresso-600">{CONTACT_CONFIG.pickup.addressLine1}, {CONTACT_CONFIG.pickup.addressLine2}, {CONTACT_CONFIG.pickup.cityStateZip}</p>
                <p className="text-[0.7rem] text-rose-600 mt-0.5">{CONTACT_CONFIG.pickup.pickupHours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary & Payment Button */}
        <div className="lg:col-span-5 bg-[#FFFDF9] rounded-luxury-lg border border-cream-300 p-6 space-y-6 shadow-card">
          <div className="flex items-center justify-between border-b border-cream-200 pb-3">
            <h3 className="font-serif text-xl font-medium text-espresso-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-500" />
              <span>Order Summary</span>
            </h3>
            <span className="text-xs text-espresso-600">{items.length} item{items.length > 1 ? 's' : ''}</span>
          </div>

          {/* Items breakdown list */}
          <div className="divide-y divide-cream-200 max-h-64 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 flex gap-3 text-xs">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-14 h-14 object-cover rounded-md border border-cream-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm font-medium text-espresso-900 truncate">
                    {item.product.name}
                  </p>
                  <p className="text-[0.7rem] text-espresso-600">
                    Qty: {item.quantity} × ₹{item.unitPrice}
                  </p>
                  {item.customization?.lettering && (
                    <p className="text-[0.68rem] text-rose-600 truncate mt-0.5">
                      "{item.customization.lettering}"
                    </p>
                  )}
                </div>
                <span className="font-serif font-semibold text-espresso-900 shrink-0">
                  ₹{item.subtotal}
                </span>
              </div>
            ))}
          </div>

          {/* Calculations */}
          <div className="border-t border-cream-200 pt-4 space-y-3 text-xs text-espresso-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-espresso-900">₹{subtotal}</span>
            </div>

            {/* Mandatory Deposit Highlight */}
            <div className="p-4 rounded-luxury bg-blush-50 border border-rose-200 space-y-1.5">
              <div className="flex justify-between font-semibold text-rose-600 text-sm">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  Required 50% Deposit
                </span>
                <span>₹{depositRequired}</span>
              </div>
              <p className="text-[0.68rem] text-espresso-700 leading-relaxed">
                As per {BRAND_CONFIG.name} ordering policy, a 50% deposit is non-refundable and required to confirm your bake slot.
              </p>
            </div>

            <div className="flex justify-between text-espresso-600 text-xs pt-1">
              <span>Remaining balance (Due on pickup)</span>
              <span>₹{balanceDue}</span>
            </div>
          </div>

          {/* PaymentButton Component (Razorpay Placeholder) */}
          <div className="pt-2 space-y-3">
            {/* 
              TODO: Future Razorpay Integration:
              When Razorpay is integrated, this button invokes:
              paymentService.openRazorpayModal({ orderId, amount: depositRequired })
            */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isProcessing}
              icon={<CreditCard className="w-4 h-4" />}
            >
              {isProcessing ? 'Confirming Deposit...' : `Continue to Payment • ₹${depositRequired}`}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[0.7rem] text-espresso-600">
              <Lock className="w-3 h-3 text-espresso-500" />
              <span>Razorpay Integration Ready • Encrypted 256-bit checkout</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
