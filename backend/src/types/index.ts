/**
 * Core Data & API Types for Giftagram Backend
 */

export type ProductCategory = 'cakes' | 'bouquets' | 'cupcakes' | 'hampers' | 'trousseau' | 'frames' | 'bento' | 'tiered-cakes' | 'pr-preeties';

export type OrderStatus =
  | 'pending_payment'
  | 'payment_pending'
  | 'deposit_paid'
  | 'confirmed'
  | 'ready'
  | 'completed'
  | 'payment_failed'
  | 'cancelled';

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  weight: string | null;
  active: number;
  featured: number;
  flavor_category: string | null;
  stem_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  r2_key: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
  secure_url?: string | null;
  public_id?: string | null;
  folder?: string | null;
  is_primary?: number | null;
}

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export type FulfillmentType = 'delivery' | 'pickup';

export interface DeliveryAddress {
  addressLine1: string;
  addressLine2?: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  deliveryDate: string;
  deliveryTime: string;
}

export interface OrderRow {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: OrderStatus;
  subtotal: number;
  deposit_amount: number;
  remaining_amount: number;
  currency: string;
  pickup_date: string;
  pickup_time: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  notes: string | null;
  fulfillment_type?: FulfillmentType;
  address_line1?: string | null;
  address_line2?: string | null;
  locality?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  delivery_date?: string | null;
  delivery_time?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface CakeCustomizationRow {
  id: string;
  order_item_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  pickup_date: string;
  pickup_time: string;
  design_requirements: string;
  colors: string | null;
  lettering: string | null;
  additional_notes: string | null;
  deposit_acknowledged: number;
  created_at: string;
}

export interface PaymentRow {
  id: string;
  order_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  amount: number; // in paise
  currency: string;
  status: string;
  signature_verified: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInputItem {
  productId: string;
  quantity: number;
  cakeCustomization?: {
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
  };
}

export interface CreateOrderInput {
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  fulfillmentType?: FulfillmentType;
  deliveryAddress?: DeliveryAddress;
  pickupDate?: string;
  pickupTime?: string;
  specialInstructions?: string;
  items: CreateOrderInputItem[];
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  category: ProductCategory | string;
  description: string;
  price: number;
  weight?: string | null;
  active?: number | boolean;
  featured?: number | boolean;
  flavorCategory?: string | null;
  stemCount?: number | null;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  category?: ProductCategory | string;
  description?: string;
  price?: number;
  weight?: string | null;
  active?: number | boolean;
  featured?: number | boolean;
  flavorCategory?: string | null;
  stemCount?: number | null;
}

export * from './admin';

