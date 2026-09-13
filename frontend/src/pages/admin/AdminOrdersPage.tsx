import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  X,
  Loader2,
  Eye,
  Sparkles,
  Calendar,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { adminOrderService, AdminOrderSummary } from '../../services/adminOrderService';
import { AdminOrderDetailDrawer } from '../../components/admin/AdminOrderDetailDrawer';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

type StatusFilter = 'all' | 'deposit_paid' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled' | 'payment_pending';

export const AdminOrdersPage: React.FC = () => {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Selected Order for Dossier Drawer
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const fetchOrders = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setIsRefreshing(true);
      setErrorMessage(null);
      try {
        const data = await adminOrderService.getOrders();
        setOrders(data);
      } catch (err: any) {
        if (err.message?.includes('expired') || err.message?.includes('sign in')) {
          await logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        setErrorMessage(err.message || 'Unable to load orders right now.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [logout, navigate]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // 2. Search Query (Order number, customer name, customer phone, customer email)
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesOrder = order.orderNumber.toLowerCase().includes(q);
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone.includes(q);
        const matchesEmail = order.customerEmail ? order.customerEmail.toLowerCase().includes(q) : false;

        if (!matchesOrder && !matchesName && !matchesPhone && !matchesEmail) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  const handleOpenDossier = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDrawerOpen(true);
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
          label: 'Completed',
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
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cream-300 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.2em] uppercase font-semibold text-rose-600 bg-rose-50 border border-rose-200/80 px-3 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Atelier Ledger
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-normal tracking-tight">
            Orders
          </h1>
          <p className="text-sm sm:text-base text-espresso-700 mt-1 font-sans">
            Manage bespoke commissions, scheduled pickups, and financial deposit records.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-espresso-700 hover:text-espresso-900 bg-white hover:bg-cream-100 border border-cream-300 px-3.5 py-2.5 rounded-full shadow-soft transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh orders ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-500' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5 shadow-soft">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="bg-white border border-cream-300 rounded-2xl shadow-soft p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
            <input
              type="text"
              placeholder="Search by order number (GFT-...), customer name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-cream-50/60 border border-cream-300 rounded-xl text-espresso-900 placeholder:text-cream-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso-400 hover:text-espresso-700 p-0.5 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filters Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'deposit_paid', label: 'Deposit Paid' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'processing', label: 'Kitchen Prep' },
            { id: 'ready', label: 'Ready' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
            { id: 'payment_pending', label: 'Pending Payment' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id as StatusFilter)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-espresso-900 text-cream-50 shadow-sm'
                  : 'bg-cream-100/80 text-espresso-700 hover:bg-cream-200/80'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Counter Summary */}
        <div className="pt-2 border-t border-cream-200/60 flex flex-wrap items-center justify-between text-xs text-espresso-600 gap-2">
          <div>
            Showing <strong className="text-espresso-900 font-semibold">{filteredOrders.length}</strong> of{' '}
            <span>{orders.length} orders in ledger</span>
            {searchTerm && <span className="ml-2 text-rose-600 font-medium">(filtered by &ldquo;{searchTerm}&rdquo;)</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{orders.filter((o) => o.status === 'deposit_paid').length} Deposit Paid</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{orders.filter((o) => o.status === 'processing').length} In Prep</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{orders.filter((o) => o.status === 'ready').length} Ready</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Orders Table View */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3 bg-white rounded-2xl border border-cream-300 shadow-soft">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
          <p className="text-sm text-espresso-700 font-serif">Curating atelier orders ledger...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-white rounded-2xl border border-dashed border-cream-300 shadow-soft p-6">
          <div className="w-12 h-12 rounded-2xl bg-cream-100 flex items-center justify-center text-espresso-400 mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-medium text-espresso-900 font-serif">No orders match your filter</h3>
            <p className="text-xs text-espresso-600 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or selecting another order status filter.
            </p>
          </div>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-full border border-rose-200 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-cream-300/90 rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50/70 text-[0.68rem] tracking-[0.15em] uppercase font-semibold text-espresso-600">
                  <th className="py-3.5 px-4 sm:px-6">Order Reference</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Scheduled Pickup</th>
                  <th className="py-3.5 px-4">Financials</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200/70 text-xs sm:text-sm">
                {filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenDossier(order.id)}
                      className="hover:bg-cream-50/60 transition-colors cursor-pointer group"
                    >
                      {/* Order Reference */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="min-w-0">
                          <span className="font-mono text-sm font-semibold text-espresso-900 group-hover:text-rose-600 transition-colors block">
                            {order.orderNumber}
                          </span>
                          <span className="text-[0.7rem] text-espresso-500 font-mono block">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            &bull; {order.itemsCount} item(s)
                          </span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0">
                          <span className="font-medium text-espresso-900 block truncate">
                            {order.customerName}
                          </span>
                          <span className="text-xs text-espresso-500 font-mono block">
                            +91 {order.customerPhone}
                          </span>
                        </div>
                      </td>

                      {/* Scheduled Pickup */}
                      <td className="py-3.5 px-4 text-xs text-espresso-700">
                        {order.pickupDate ? (
                          <div>
                            <span className="font-medium text-espresso-900 block flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-rose-500" />
                              {order.pickupDate}
                            </span>
                            <span className="text-[0.7rem] text-espresso-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-espresso-400" />
                              {order.pickupTime || 'Standard slot'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-cream-400">—</span>
                        )}
                      </td>

                      {/* Financials & Balance */}
                      <td className="py-3.5 px-4 text-xs">
                        <div>
                          <span className="font-mono font-semibold text-espresso-900 block">
                            ₹{order.subtotal.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[0.68rem] text-emerald-700 font-mono block">
                            Paid: ₹{order.depositAmount.toLocaleString('en-IN')}
                          </span>
                          {order.remainingAmount > 0 && (
                            <span className="text-[0.68rem] text-espresso-500 font-mono block">
                              Due: ₹{order.remainingAmount.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDossier(order.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-espresso-800 hover:text-rose-600 bg-cream-100 hover:bg-cream-200 border border-cream-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Inspect full order dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Dossier</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Slide-over Dossier Drawer */}
      <AdminOrderDetailDrawer
        isOpen={isDrawerOpen}
        orderId={selectedOrderId}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedOrderId(null);
        }}
        onOrderUpdated={() => {
          fetchOrders(false);
        }}
      />
    </div>
  );
};
