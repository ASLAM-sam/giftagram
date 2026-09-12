import { CartItem, OrderCustomerInfo, OrderRecord } from '../types';

/**
 * Order Service Architecture Stub
 * 
 * Future Backend Architecture:
 * Client (React) 
 *   → Cloudflare Worker API (`POST /api/orders`)
 *   → Cloudflare D1 Database (`orders` and `order_items` tables)
 *   → Cloudflare Queues for transactional email/SMS notifications
 */

export interface CreateOrderPayload {
  customer: OrderCustomerInfo;
  items: CartItem[];
  subtotal: number;
  depositRequired: number;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  order: OrderRecord;
  paymentSessionId?: string;
}

export const orderService = {
  /**
   * Submits an order.
   * Currently saves order state to localStorage for frontend prototype verification.
   * 
   * TODO: Replace local simulation with Cloudflare Worker API endpoint:
   * const response = await fetch(`${API_BASE_URL}/orders`, {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify(payload),
   * });
   * return await response.json();
   */
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    // Generate boutique luxury order reference format: e.g. GFT-2026-8942
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `GFT-${new Date().getFullYear()}-${randomSuffix}`;
    
    const orderRecord: OrderRecord = {
      orderId,
      createdAt: new Date().toISOString(),
      customer: payload.customer,
      items: payload.items,
      subtotal: payload.subtotal,
      depositRequired: payload.depositRequired,
      balanceDueOnPickup: payload.subtotal - payload.depositRequired,
      paymentStatus: 'deposit_pending',
    };

    // Store in localStorage for prototype order success view
    try {
      localStorage.setItem(`giftagram_order_${orderId}`, JSON.stringify(orderRecord));
      localStorage.setItem('giftagram_last_order', JSON.stringify(orderRecord));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }

    // Simulate network delay of a high-speed Cloudflare Worker
    await new Promise((resolve) => setTimeout(resolve, 450));

    return {
      success: true,
      orderId,
      order: orderRecord,
      paymentSessionId: `pay_sess_${Math.random().toString(36).substring(2, 9)}`,
    };
  },

  getOrderById(orderId: string): OrderRecord | null {
    try {
      const data = localStorage.getItem(`giftagram_order_${orderId}`);
      if (data) return JSON.parse(data);
      const last = localStorage.getItem('giftagram_last_order');
      if (last) {
        const parsed = JSON.parse(last);
        if (parsed.orderId === orderId) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  },
};
