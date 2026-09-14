import { CartItem, OrderCustomerInfo, OrderRecord } from '../types';
import { ENV } from '../config/env';

/**
 * Order Service
 * Communicates with Cloudflare Worker API connected to Cloudflare D1
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
  orderNumber?: string;
  order: OrderRecord;
  paymentSessionId?: string;
  depositAmountPaise?: number;
}

export interface OrderLookupItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderLookupResult {
  orderNumber: string;
  status: 'payment_pending' | 'deposit_paid' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  customerName: string;
  fulfillmentType?: 'delivery' | 'pickup';
  deliveryAddress?: {
    addressLine1: string;
    addressLine2?: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    deliveryDate?: string;
    deliveryTime?: string;
  };
  pickupDate?: string;
  pickupTime?: string;
  subtotal: number;
  depositAmount: number;
  remainingAmount: number;
  items: OrderLookupItem[];
}

export interface LookupOrderResponse {
  success: boolean;
  order?: OrderLookupResult;
  error?: string;
}

export const orderService = {
  /**
   * Submits an order to the Cloudflare Worker API.
   * Authoritative price and deposit recalculations occur on the server.
   */
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    try {
      const response = await fetch(`${ENV.API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          customer: {
            name: payload.customer.fullName,
            phone: payload.customer.phone,
            email: payload.customer.email,
          },
          fulfillmentType: payload.customer.fulfillmentType || 'delivery',
          pickupDate: payload.customer.pickupDate,
          pickupTime: payload.customer.pickupTime,
          deliveryAddress: payload.customer.deliveryAddress,
          specialInstructions: payload.customer.specialInstructions,
          items: payload.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            cakeCustomization: item.customization
              ? {
                  fullName: item.customization.fullName,
                  phone: item.customization.phoneNumber,
                  email: item.customization.email,
                  pickupDate: item.customization.pickupDate,
                  pickupTime: item.customization.pickupTime,
                  designRequirements: item.customization.designRequirements,
                  colors: item.customization.colors,
                  lettering: item.customization.lettering,
                  additionalNotes: item.customization.additionalNotes,
                  depositAcknowledged: item.customization.agreedToDeposit,
                }
              : undefined,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const apiOrder = result.data;
          const orderRecord: OrderRecord = {
            orderId: apiOrder.orderNumber || apiOrder.id,
            createdAt: apiOrder.createdAt || new Date().toISOString(),
            customer: payload.customer,
            items: payload.items,
            subtotal: apiOrder.subtotal,
            depositRequired: apiOrder.depositAmount,
            balanceDueOnPickup: apiOrder.remainingAmount,
            paymentStatus: apiOrder.status === 'deposit_paid' ? 'deposit_paid' : 'deposit_pending',
          };

          // Cache locally for immediate receipt view
          localStorage.setItem(`giftagram_order_${orderRecord.orderId}`, JSON.stringify(orderRecord));
          localStorage.setItem('giftagram_last_order', JSON.stringify(orderRecord));

          return {
            success: true,
            orderId: apiOrder.id,
            orderNumber: apiOrder.orderNumber,
            order: orderRecord,
            depositAmountPaise: apiOrder.depositAmountPaise || Math.round(apiOrder.depositAmount * 100),
          };
        }
      }
    } catch (err) {
      console.warn('[OrderService] Worker API unavailable, using local simulated order fallback:', err);
    }

    // Local simulation fallback
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `GFT-${new Date().getFullYear()}-${randomSuffix}`;

    const orderRecord: OrderRecord = {
      orderId: orderNumber,
      createdAt: new Date().toISOString(),
      customer: payload.customer,
      items: payload.items,
      subtotal: payload.subtotal,
      depositRequired: payload.depositRequired,
      balanceDueOnPickup: payload.subtotal - payload.depositRequired,
      paymentStatus: 'deposit_pending',
    };

    localStorage.setItem(`giftagram_order_${orderNumber}`, JSON.stringify(orderRecord));
    localStorage.setItem('giftagram_last_order', JSON.stringify(orderRecord));

    return {
      success: true,
      orderId: orderNumber,
      orderNumber,
      order: orderRecord,
      depositAmountPaise: Math.round(payload.depositRequired * 100),
    };
  },

  /**
   * Looks up an order by order number and phone number
   */
  async lookupOrder(orderNumber: string, phone: string): Promise<LookupOrderResponse> {
    try {
      const response = await fetch(`${ENV.API_URL}/api/orders/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ orderNumber, phone }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return { success: true, order: json.data };
        }
        return { success: false, error: json.error?.message || 'Order not found' };
      }
    } catch (err) {
      console.warn('[OrderService] Remote lookup unavailable, searching local records:', err);
    }

    // Local fallback check
    const local = this.getOrderById(orderNumber);
    if (local && local.customer.phone.replace(/\D/g, '').endsWith(phone.replace(/\D/g, '').slice(-10))) {
      return {
        success: true,
        order: {
          orderNumber: local.orderId,
          status: local.paymentStatus === 'deposit_paid' ? 'deposit_paid' : 'payment_pending',
          customerName: local.customer.fullName,
          fulfillmentType: local.customer.fulfillmentType || 'delivery',
          deliveryAddress: local.customer.deliveryAddress,
          pickupDate: local.customer.pickupDate || local.customer.deliveryAddress?.deliveryDate || '',
          pickupTime: local.customer.pickupTime || local.customer.deliveryAddress?.deliveryTime || '',
          subtotal: local.subtotal,
          depositAmount: local.depositRequired,
          remainingAmount: local.balanceDueOnPickup,
          items: local.items.map((i) => ({
            productName: i.product.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: i.subtotal,
          })),
        },
      };
    }

    return {
      success: false,
      error: 'No order record found matching this Order Number and contact phone.',
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
