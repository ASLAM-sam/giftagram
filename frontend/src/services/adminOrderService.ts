import { ENV } from '../config/env';

export interface AdminDeliveryAddressSnapshot {
  addressLine1: string;
  addressLine2?: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  deliveryDate?: string;
  deliveryTime?: string;
  instructions?: string;
}

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType?: 'delivery' | 'pickup';
  deliveryDate?: string;
  deliveryTime?: string;
  status: string;
  subtotal: number;
  depositAmount: number;
  remainingAmount: number;
  currency: string;
  pickupDate?: string;
  pickupTime?: string;
  notes?: string;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCakeCustomization {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  pickupDate: string;
  pickupTime: string;
  designRequirements: string;
  colors?: string;
  lettering?: string;
  additionalNotes?: string;
  depositAcknowledged: boolean;
}

export interface AdminOrderItemDetail {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
  cakeCustomization?: AdminCakeCustomization | null;
}

export interface AdminPaymentRecord {
  id: string;
  amount: number;
  amountRupees: number;
  currency: string;
  status: string;
  provider: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  createdAt: string;
}

export interface AdminOrderEvent {
  id: string;
  eventType: string;
  payload: any;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  deliveryAddress?: AdminDeliveryAddressSnapshot;
  items: AdminOrderItemDetail[];
  payments: AdminPaymentRecord[];
  events: AdminOrderEvent[];
}

export interface AdminOrderFilterParams {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const adminOrderService = {
  /**
   * Retrieves orders for admin view with optional filtering and search.
   */
  async getOrders(filters?: AdminOrderFilterParams): Promise<AdminOrderSummary[]> {
    const url = new URL(`${ENV.API_URL}/api/admin/orders`);
    if (filters?.status && filters.status !== 'all') {
      url.searchParams.set('status', filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      url.searchParams.set('search', filters.search.trim());
    }
    if (filters?.limit) {
      url.searchParams.set('limit', String(filters.limit));
    }
    if (filters?.offset) {
      url.searchParams.set('offset', String(filters.offset));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });

    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || 'Unable to load orders right now.');
    }

    return result.data || [];
  },

  /**
   * Retrieves full order dossier including items, customizations, and payment history.
   */
  async getOrderById(idOrOrderNumber: string): Promise<AdminOrderDetail> {
    const response = await fetch(`${ENV.API_URL}/api/admin/orders/${encodeURIComponent(idOrOrderNumber)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });

    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || 'Unable to retrieve order details.');
    }

    return result.data;
  },

  /**
   * Updates an order's status following business lifecycle validation.
   */
  async updateOrderStatus(idOrOrderNumber: string, status: string, reason?: string): Promise<AdminOrderDetail> {
    const response = await fetch(
      `${ENV.API_URL}/api/admin/orders/${encodeURIComponent(idOrOrderNumber)}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, reason }),
      }
    );

    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || 'Unable to update this order.');
    }

    return result.data;
  },
};
