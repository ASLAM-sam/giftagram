import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingBag,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  History,
  Ban,
  Package,
  Truck,
  Store,
  MapPin,
} from 'lucide-react';
import { adminOrderService, AdminOrderDetail } from '../../services/adminOrderService';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminOrderDetailDrawerProps {
  isOpen: boolean;
  orderId: string | null;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

export const AdminOrderDetailDrawer: React.FC<AdminOrderDetailDrawerProps> = ({
  isOpen,
  orderId,
  onClose,
  onOrderUpdated,
}) => {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Cancellation Modal State
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  const loadOrderDetail = React.useCallback(
    async (id: string) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await adminOrderService.getOrderById(id);
        setOrder(data);
      } catch (err: any) {
        if (err.message?.includes('expired') || err.message?.includes('sign in')) {
          await logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        setErrorMessage(err.message || 'Unable to retrieve order details.');
      } finally {
        setIsLoading(false);
      }
    },
    [logout, navigate]
  );

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetail(orderId);
    } else {
      setOrder(null);
      setErrorMessage(null);
      setSuccessBanner(null);
      setShowCancelConfirm(false);
      setCancelReason('');
    }
  }, [isOpen, orderId, loadOrderDetail]);

  // Clear success banner after 4s
  useEffect(() => {
    if (!successBanner) return;
    const timer = setTimeout(() => setSuccessBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [successBanner]);

  const handleStatusTransition = async (newStatus: string, reason?: string) => {
    if (!order) return;
    setIsUpdatingStatus(true);
    setErrorMessage(null);

    try {
      const updated = await adminOrderService.updateOrderStatus(order.id, newStatus, reason);
      setOrder(updated);
      setSuccessBanner(`Order transitioned to ${newStatus.replace('_', ' ')}.`);
      setShowCancelConfirm(false);
      setCancelReason('');
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('sign in')) {
        await logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMessage(err.message || 'Unable to update order status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'payment_pending':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dot: 'bg-amber-500',
          label: 'Payment Pending',
        };
      case 'deposit_paid':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200/80',
          dot: 'bg-blue-500',
          label: 'Deposit Paid (50%)',
        };
      case 'confirmed':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200/80',
          dot: 'bg-purple-500',
          label: 'Confirmed',
        };
      case 'processing':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dot: 'bg-amber-500 animate-pulse',
          label: 'Kitchen Prep',
        };
      case 'ready':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-500 animate-pulse',
          label: 'Ready for Pickup',
        };
      case 'completed':
        return {
          bg: 'bg-cream-200 text-espresso-800 border-cream-300',
          dot: 'bg-emerald-600',
          label: 'Completed & Handed Over',
        };
      case 'cancelled':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200/80',
          dot: 'bg-rose-500',
          label: 'Cancelled',
        };
      default:
        return {
          bg: 'bg-cream-100 text-espresso-700 border-cream-300',
          dot: 'bg-cream-400',
          label: status,
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-espresso-950/40 backdrop-blur-sm transition-opacity cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Order Dossier"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-2xl bg-cream-50 h-full shadow-2xl flex flex-col z-10 border-l border-cream-300"
          >
            {/* Header */}
            <div className="p-6 bg-white border-b border-cream-200/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-rose-600 block">
                    Atelier Order Dossier
                  </span>
                  <h2 className="text-lg font-serif font-medium text-espresso-900 truncate max-w-sm">
                    {order ? order.orderNumber : 'Loading dossier...'}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close dossier"
                className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 text-espresso-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Notifications */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successBanner && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successBanner}</span>
                </div>
              )}

              {isLoading ? (
                <div className="py-24 text-center space-y-3 bg-white rounded-2xl border border-cream-200 shadow-soft">
                  <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
                  <p className="text-xs text-espresso-600 font-serif">Retrieving artisanal commission details...</p>
                </div>
              ) : !order ? (
                <div className="py-20 text-center space-y-2 bg-white rounded-2xl border border-cream-200 p-6">
                  <p className="text-sm font-medium text-espresso-800">Order not found</p>
                </div>
              ) : (
                <>
                  {/* Status Banner & Action Workflow */}
                  <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-soft space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[0.68rem] tracking-wider uppercase font-semibold text-espresso-500 block">
                          Current Order State
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                              getStatusBadge(order.status).bg
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${getStatusBadge(order.status).dot}`} />
                            <span>{getStatusBadge(order.status).label}</span>
                          </span>
                        </div>
                      </div>

                      <span className="text-xs text-espresso-500 font-mono">
                        Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Next Action Workflow Buttons */}
                    <div className="pt-3 border-t border-cream-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {order.status === 'deposit_paid' && (
                          <button
                            type="button"
                            onClick={() => handleStatusTransition('confirmed')}
                            disabled={isUpdatingStatus}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-espresso-900 hover:bg-espresso-800 text-cream-50 text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5 text-rose-300" />}
                            <span>Confirm Kitchen Schedule</span>
                          </button>
                        )}

                        {order.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleStatusTransition('processing')}
                            disabled={isUpdatingStatus}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-200" />}
                            <span>Begin Kitchen Prep</span>
                          </button>
                        )}

                        {order.status === 'processing' && (
                          <button
                            type="button"
                            onClick={() => handleStatusTransition('ready')}
                            disabled={isUpdatingStatus}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
                            <span>Mark Ready for Pickup</span>
                          </button>
                        )}

                        {order.status === 'ready' && (
                          <button
                            type="button"
                            onClick={() => handleStatusTransition('completed')}
                            disabled={isUpdatingStatus}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-espresso-950 hover:bg-black text-rose-300 text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
                            <span>Complete & Hand Over</span>
                          </button>
                        )}

                        {order.status === 'completed' && (
                          <span className="text-xs text-espresso-600 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Order has been completed and collected.
                          </span>
                        )}

                        {order.status === 'cancelled' && (
                          <span className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                            <Ban className="w-4 h-4 text-rose-500" />
                            Order was cancelled.
                          </span>
                        )}
                      </div>

                      {/* Cancel action if not completed or cancelled */}
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(true)}
                          disabled={isUpdatingStatus}
                          className="text-xs text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>

                    {/* Cancellation Confirmation Box */}
                    {showCancelConfirm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-3"
                      >
                        <div className="flex items-start gap-2 text-xs text-rose-800">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block font-semibold">Cancel this commission?</strong>
                            <span>This action will transition the order to cancelled status. Note that 50% cake deposits remain non-refundable per atelier policy.</span>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Reason for cancellation (optional)"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-rose-200 rounded-lg text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                        />

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCancelConfirm(false)}
                            className="px-3 py-1.5 text-xs text-espresso-600 hover:bg-cream-100 rounded-lg"
                          >
                            Keep Order
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusTransition('cancelled', cancelReason)}
                            disabled={isUpdatingStatus}
                            className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-sm"
                          >
                            Confirm Cancellation
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Customer Contact & Fulfillment Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Customer Info Card */}
                    <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-soft space-y-3">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-espresso-700">
                        <User className="w-3.5 h-3.5 text-rose-500" />
                        <span>Customer Contact</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <p className="font-serif text-sm font-medium text-espresso-900">{order.customerName}</p>
                        <p className="text-espresso-600 flex items-center gap-2 font-mono">
                          <Phone className="w-3.5 h-3.5 text-espresso-400" />
                          <span>+91 {order.customerPhone}</span>
                        </p>
                        {order.customerEmail && (
                          <p className="text-espresso-600 flex items-center gap-2 truncate">
                            <Mail className="w-3.5 h-3.5 text-espresso-400 shrink-0" />
                            <span className="truncate">{order.customerEmail}</span>
                          </p>
                        )}
                        <div className="pt-2 border-t border-cream-100 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[0.68rem] px-2 py-0.5 rounded-full font-medium ${
                              order.fulfillmentType === 'delivery'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200/70'
                                : 'bg-cream-100 text-espresso-700 border border-cream-200'
                            }`}
                          >
                            {order.fulfillmentType === 'delivery' ? (
                              <Truck className="w-3 h-3 text-blue-500" />
                            ) : (
                              <Store className="w-3 h-3 text-espresso-500" />
                            )}
                            <span>{order.fulfillmentType === 'delivery' ? 'Doorstep Delivery' : 'Studio Pickup'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fulfillment & Address Card */}
                    <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-soft space-y-3">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-espresso-700">
                        {order.fulfillmentType === 'delivery' ? (
                          <Truck className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span>
                          {order.fulfillmentType === 'delivery' ? 'Doorstep Delivery Address' : 'Scheduled Pickup'}
                        </span>
                      </div>

                      {order.fulfillmentType === 'delivery' && order.deliveryAddress ? (
                        <div className="space-y-2 text-xs">
                          <div className="space-y-1">
                            <p className="font-medium text-espresso-900 flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span>
                                {order.deliveryAddress.addressLine1}
                                {order.deliveryAddress.addressLine2 && `, ${order.deliveryAddress.addressLine2}`}
                              </span>
                            </p>
                            <p className="text-espresso-600 pl-5">
                              {order.deliveryAddress.locality}, {order.deliveryAddress.city},{' '}
                              {order.deliveryAddress.state} —{' '}
                              <strong className="text-espresso-900 font-mono font-semibold">
                                {order.deliveryAddress.pincode}
                              </strong>
                            </p>
                          </div>

                          <div className="pt-2 border-t border-cream-100 grid grid-cols-2 gap-2 text-[0.72rem]">
                            <div className="flex items-center gap-1.5 text-espresso-700">
                              <Calendar className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>{order.deliveryAddress.deliveryDate || order.pickupDate || 'Scheduled'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-espresso-700">
                              <Clock className="w-3 h-3 text-espresso-400 shrink-0" />
                              <span>{order.deliveryAddress.deliveryTime || order.pickupTime || 'Standard window'}</span>
                            </div>
                          </div>

                          {(order.deliveryAddress.instructions || order.notes) && (
                            <p className="text-[0.7rem] text-espresso-600 bg-cream-50 p-2 rounded-lg border border-cream-200">
                              <strong>Instructions:</strong> {order.deliveryAddress.instructions || order.notes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5 text-xs">
                          <p className="text-espresso-900 font-medium flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-rose-500" />
                            <span>{order.pickupDate || 'Date to be scheduled'}</span>
                          </p>
                          <p className="text-espresso-600 flex items-center gap-2 font-mono">
                            <Clock className="w-3.5 h-3.5 text-espresso-400" />
                            <span>{order.pickupTime || 'Standard atelier hours (11:00 - 20:00)'}</span>
                          </p>
                          {order.notes && (
                            <p className="text-[0.72rem] text-espresso-600 bg-cream-50 p-2 rounded-lg border border-cream-200 mt-2">
                              <strong>Note:</strong> {order.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Itemized Order Snapshot & Bespoke Customizations */}
                  <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-soft space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-espresso-700">
                        <Package className="w-3.5 h-3.5 text-rose-500" />
                        <span>Itemized Purchases ({order.items.length})</span>
                      </div>
                      <span className="text-[0.68rem] text-espresso-400 font-mono">Historical Snapshot Immutability</span>
                    </div>

                    <div className="divide-y divide-cream-200">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-serif text-sm font-medium text-espresso-900">
                                {item.productNameSnapshot}
                              </h4>
                              <span className="text-xs text-espresso-500 font-mono">
                                ₹{item.unitPriceSnapshot.toLocaleString('en-IN')} &times; {item.quantity} unit(s)
                              </span>
                            </div>
                            <span className="font-mono text-sm font-medium text-espresso-900">
                              ₹{item.lineTotal.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Bespoke Cake Customization Requirements */}
                          {item.cakeCustomization && (
                            <div className="p-3.5 rounded-xl bg-cream-50 border border-cream-200/90 text-xs space-y-2">
                              <div className="flex items-center gap-1.5 text-rose-600 font-semibold tracking-wider uppercase text-[0.68rem]">
                                <Sparkles className="w-3 h-3 text-rose-500" />
                                <span>Artisanal Cake Commission Specifications</span>
                              </div>

                              {item.cakeCustomization.lettering && (
                                <div>
                                  <span className="text-espresso-500 block text-[0.68rem] uppercase font-mono">Lettering on Cake</span>
                                  <span className="font-serif text-espresso-900 italic font-medium">
                                    &ldquo;{item.cakeCustomization.lettering}&rdquo;
                                  </span>
                                </div>
                              )}

                              {item.cakeCustomization.colors && (
                                <div>
                                  <span className="text-espresso-500 block text-[0.68rem] uppercase font-mono">Color Palette & Piping</span>
                                  <span className="text-espresso-800">{item.cakeCustomization.colors}</span>
                                </div>
                              )}

                              {item.cakeCustomization.designRequirements && (
                                <div>
                                  <span className="text-espresso-500 block text-[0.68rem] uppercase font-mono">Design Requirements</span>
                                  <span className="text-espresso-800">{item.cakeCustomization.designRequirements}</span>
                                </div>
                              )}

                              {item.cakeCustomization.additionalNotes && (
                                <div>
                                  <span className="text-espresso-500 block text-[0.68rem] uppercase font-mono">Special Chef Notes</span>
                                  <span className="text-espresso-700">{item.cakeCustomization.additionalNotes}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial & Deposit Breakdown */}
                  <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-soft space-y-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-espresso-700">
                      <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                      <span>Financial & 50% Deposit Breakdown</span>
                    </div>

                    <div className="space-y-2 text-xs pt-1">
                      <div className="flex items-center justify-between text-espresso-600">
                        <span>Order Total</span>
                        <span className="font-mono">₹{order.subtotal.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex items-center justify-between text-emerald-800 font-medium bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80">
                        <div>
                          <span className="block">50% Non-Refundable Deposit Paid</span>
                          <span className="text-[0.65rem] text-emerald-600 font-mono">Verified online via Razorpay</span>
                        </div>
                        <span className="font-mono text-sm">₹{order.depositAmount.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex items-center justify-between text-espresso-900 font-medium bg-cream-100 p-2.5 rounded-xl border border-cream-300">
                        <div>
                          <span className="block">Remaining Balance Due on Pickup</span>
                          <span className="text-[0.65rem] text-espresso-500">Payable in atelier upon collection</span>
                        </div>
                        <span className="font-mono text-sm">₹{order.remainingAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Payment Audit Records */}
                    {order.payments.length > 0 && (
                      <div className="pt-3 border-t border-cream-200/80 space-y-2">
                        <span className="text-[0.68rem] uppercase tracking-wider font-semibold text-espresso-500 block">
                          Verified Payment Gateway Records
                        </span>
                        {order.payments.map((p) => (
                          <div key={p.id} className="text-[0.7rem] font-mono text-espresso-600 bg-cream-50 p-2 rounded-lg flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-espresso-900">{p.provider.toUpperCase()}</span>
                              <span className="ml-2 text-espresso-500">Ref: {p.providerOrderId || p.id}</span>
                            </div>
                            <span className="text-emerald-700 font-semibold">₹{p.amountRupees.toLocaleString('en-IN')} Verified</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Immutable Audit Log */}
                  {order.events.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-soft space-y-3">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-espresso-700">
                        <History className="w-3.5 h-3.5 text-rose-500" />
                        <span>Immutable Audit Trail ({order.events.length})</span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {order.events.map((evt) => (
                          <div key={evt.id} className="text-[0.72rem] text-espresso-600 flex items-start justify-between gap-2 border-b border-cream-100 pb-1.5 last:border-b-0">
                            <div>
                              <span className="font-semibold text-espresso-800 capitalize">
                                {evt.eventType.replace('_', ' ')}
                              </span>
                              {evt.payload?.from && (
                                <span className="ml-1 text-espresso-500">
                                  ({evt.payload.from} &rarr; {evt.payload.to})
                                </span>
                              )}
                              {evt.payload?.reason && (
                                <span className="block text-[0.68rem] text-rose-600 italic mt-0.5">
                                  &ldquo;{evt.payload.reason}&rdquo;
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[0.65rem] text-espresso-400 shrink-0">
                              {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-cream-200 flex items-center justify-between text-xs text-espresso-500 shrink-0">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                <span>Giftagram Atelier Financial Security</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-espresso-800 font-medium transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
