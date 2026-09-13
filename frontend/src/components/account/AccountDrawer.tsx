import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../../hooks/useUI';
import { orderService, OrderLookupResult, OrderLookupItem } from '../../services/orderService';
import { CONTACT_CONFIG } from '../../config/brand';
import {
  X,
  User,
  Search,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const AccountDrawer: React.FC = () => {
  const { isAccountOpen, closeAccount } = useUI();
  const [activeTab, setActiveTab] = useState<'track' | 'studio'>('track');
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [foundOrder, setFoundOrder] = useState<OrderLookupResult | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setFoundOrder(null);

    const cleanOrder = orderNumber.trim().toUpperCase();
    const cleanPhone = phone.trim();

    if (!cleanOrder) {
      setLookupError('Please enter your Order Number (e.g. GFT-2026-XXXX)');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setLookupError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      const res = await orderService.lookupOrder(cleanOrder, cleanPhone);
      if (res.success && res.order) {
        setFoundOrder(res.order);
      } else {
        setLookupError(res.error || 'No matching order found. Please verify your order number and phone.');
      }
    } catch (err: any) {
      setLookupError(err.message || 'Unable to connect to order verification service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'deposit_paid':
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-emerald-200">
            <Sparkles className="w-3 h-3" />
            50% Deposit Paid • Confirmed
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-blue-200">
            Ready for Studio Pickup
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-purple-200">
            Completed
          </span>
        );
      case 'payment_pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-amber-200">
            Payment Pending
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      {isAccountOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAccount}
            className="absolute inset-0 bg-espresso-900/30 backdrop-blur-sm"
          />

          {/* Slide-over Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-screen max-w-md bg-[#FFFDF9] border-l border-cream-300 shadow-modal flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-cream-200 flex items-center justify-between bg-cream-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blush-100 text-rose-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-medium text-espresso-900">
                      My Account & Orders
                    </h2>
                    <p className="text-[0.7rem] text-espresso-600">Giftagram Concierge Portal</p>
                  </div>
                </div>
                <button
                  onClick={closeAccount}
                  className="p-1.5 text-espresso-600 hover:text-espresso-900 rounded-full hover:bg-cream-100 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-cream-200 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('track')}
                  className={`flex-1 py-3 text-center transition-colors relative ${
                    activeTab === 'track'
                      ? 'text-rose-600 font-semibold'
                      : 'text-espresso-700 hover:text-espresso-900'
                  }`}
                >
                  <span>Track My Order</span>
                  {activeTab === 'track' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('studio')}
                  className={`flex-1 py-3 text-center transition-colors relative ${
                    activeTab === 'studio'
                      ? 'text-rose-600 font-semibold'
                      : 'text-espresso-700 hover:text-espresso-900'
                  }`}
                >
                  <span>Studio & Pickup Info</span>
                  {activeTab === 'studio' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 rounded-full" />
                  )}
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {activeTab === 'track' ? (
                  <div className="space-y-5">
                    {/* Track Form */}
                    <div className="bg-cream-50/80 p-4 rounded-luxury border border-cream-200 text-xs space-y-3">
                      <p className="text-espresso-700 leading-relaxed font-light">
                        Track your cake bake schedule, deposit status, and pickup reservation.
                      </p>
                      <form onSubmit={handleLookup} className="space-y-3">
                        <div>
                          <label className="block text-[0.72rem] font-semibold text-espresso-900 mb-1">
                            Order Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            placeholder="e.g. GFT-2026-8942"
                            className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-espresso-900 uppercase font-mono text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[0.72rem] font-semibold text-espresso-900 mb-1">
                            Phone Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. 8141376677"
                            className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-espresso-900 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-2.5 px-4 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white rounded-full font-medium transition-colors shadow-soft flex items-center justify-center gap-2"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>{isLoading ? 'Checking Record...' : 'Verify Order Status'}</span>
                        </button>
                      </form>

                      {lookupError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-[0.72rem]">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{lookupError}</span>
                        </div>
                      )}
                    </div>

                    {/* Found Order Card */}
                    {foundOrder && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-luxury border border-cream-300 p-4 shadow-card space-y-4 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-cream-200 pb-3">
                          <div>
                            <span className="text-[0.65rem] uppercase tracking-wider text-espresso-600 font-semibold">
                              Verified Order
                            </span>
                            <p className="font-serif text-lg font-bold text-rose-600">
                              {foundOrder.orderNumber}
                            </p>
                          </div>
                          <div>{getStatusBadge(foundOrder.status)}</div>
                        </div>

                        {/* Customer & Pickup */}
                        <div className="space-y-1.5 text-espresso-800 bg-cream-50 p-3 rounded-lg border border-cream-200">
                          <div className="flex items-center justify-between">
                            <span className="text-espresso-600 font-medium">Customer:</span>
                            <span className="font-semibold text-espresso-900">{foundOrder.customerName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-espresso-600 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-rose-500" /> Date:
                            </span>
                            <span className="font-semibold">{foundOrder.pickupDate}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-espresso-600 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-rose-500" /> Time Window:
                            </span>
                            <span className="font-semibold">{foundOrder.pickupTime}</span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 border-t border-cream-200 pt-3">
                          <p className="text-[0.7rem] uppercase tracking-wider font-semibold text-espresso-600">
                            Ordered Items
                          </p>
                          <div className="space-y-2 max-h-36 overflow-y-auto">
                            {foundOrder.items.map((item: OrderLookupItem, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-espresso-900">
                                <div>
                                  <p className="font-medium">{item.productName}</p>
                                  <p className="text-[0.68rem] text-espresso-600">Qty: {item.quantity}</p>
                                </div>
                                <span className="font-medium">₹{item.lineTotal}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Financials */}
                        <div className="border-t border-cream-200 pt-3 space-y-1.5 text-espresso-800">
                          <div className="flex justify-between">
                            <span className="text-espresso-600">Total Order Amount</span>
                            <span className="font-semibold">₹{foundOrder.subtotal}</span>
                          </div>
                          <div className="flex justify-between text-rose-600 font-semibold">
                            <span>50% Deposit Paid</span>
                            <span>₹{foundOrder.depositAmount}</span>
                          </div>
                          <div className="flex justify-between text-espresso-600 pt-1 border-t border-cream-200 text-[0.7rem]">
                            <span>Balance Due on Pickup</span>
                            <span className="font-medium text-espresso-900">₹{foundOrder.remainingAmount}</span>
                          </div>
                        </div>

                        {/* WhatsApp support */}
                        <a
                          href={CONTACT_CONFIG.whatsapp.chatUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-blush-50 hover:bg-blush-100 text-rose-600 font-medium transition-colors border border-rose-200 text-[0.75rem]"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Inquire with Studio on WhatsApp</span>
                        </a>
                      </motion.div>
                    )}

                    {/* Account Roadmap Note */}
                    <div className="p-3.5 rounded-luxury bg-blush-50/70 border border-rose-200/80 text-[0.72rem] text-espresso-700 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-espresso-900">
                        <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                        <span>Private Guest Verification</span>
                      </div>
                      <p className="leading-relaxed">
                        To protect your privacy, order details require matching both your exact Order Reference ID and phone number. Full customer account profiles will be enabled soon.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Studio Info Tab */
                  <div className="space-y-4 text-xs text-espresso-800">
                    <div className="bg-cream-50 p-4 rounded-luxury border border-cream-200 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-espresso-900">{CONTACT_CONFIG.pickup.studioName}</p>
                          <p className="text-espresso-600 mt-0.5">
                            {CONTACT_CONFIG.pickup.addressLine1}, {CONTACT_CONFIG.pickup.addressLine2}
                          </p>
                          <p className="text-espresso-600">{CONTACT_CONFIG.pickup.cityStateZip}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 pt-2 border-t border-cream-200">
                        <Clock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-espresso-900">Studio Hours</p>
                          <p className="text-espresso-600 mt-0.5">{CONTACT_CONFIG.pickup.pickupHours}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-luxury border border-cream-200 space-y-3">
                      <h4 className="font-serif text-sm font-semibold text-espresso-900">
                        Direct Studio Inquiries
                      </h4>
                      <div className="space-y-2 text-[0.75rem]">
                        <a
                          href={CONTACT_CONFIG.whatsapp.chatUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-cream-50 hover:bg-blush-50 transition-colors"
                        >
                          <span className="font-medium text-espresso-900">WhatsApp Concierge</span>
                          <span className="text-rose-600 flex items-center gap-1">
                            Chat <ExternalLink className="w-3 h-3" />
                          </span>
                        </a>
                        <a
                          href={CONTACT_CONFIG.phone.telUrl}
                          className="flex items-center justify-between p-2 rounded-lg bg-cream-50 hover:bg-blush-50 transition-colors"
                        >
                          <span className="font-medium text-espresso-900">Studio Phone</span>
                          <span className="text-rose-600">{CONTACT_CONFIG.phone.displayNumber}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
