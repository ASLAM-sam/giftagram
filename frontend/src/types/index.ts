export type ProductCategory = 'cakes' | 'bouquets';

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  price: number;
  weight?: string; // e.g. "500 g" for cakes
  shortDescription: string;
  description: string;
  images: string[];
  featured?: boolean;
  tags: string[];
  flavorCategory?: 'chocolate' | 'fruit' | 'premium';
  bouquetCategory?: 'roses' | 'chocolate' | 'photo';
  stemCount?: number;
  disclaimers?: string[];
  leadTimeHours?: number;
}

export interface CakeCustomization {
  fullName: string;
  phoneNumber: string;
  email?: string;
  pickupDate: string;
  pickupTime: string;
  designRequirements: string;
  colors: string;
  lettering: string;
  additionalNotes?: string;
  agreedToDeposit: boolean;
}

export interface CartItem {
  id: string; // unique item id in cart (product.id + hash of customization if any)
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  customization?: CakeCustomization;
  subtotal: number;
  addedAt: number;
}

export interface ComingSoonCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  iconName?: string;
}

export interface OrderCustomerInfo {
  fullName: string;
  phone: string;
  email: string;
  pickupDate: string;
  pickupTime: string;
  specialInstructions?: string;
}

export interface OrderRecord {
  orderId: string;
  createdAt: string;
  customer: OrderCustomerInfo;
  items: CartItem[];
  subtotal: number;
  depositRequired: number; // 50%
  balanceDueOnPickup: number; // 50%
  paymentStatus: 'deposit_pending' | 'deposit_paid' | 'completed';
}
