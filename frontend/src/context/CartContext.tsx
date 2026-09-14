import React, { createContext, useState, useEffect } from 'react';
import { CartItem, Product, CakeCustomization } from '../types';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  depositRequired: number; // 50% non-refundable deposit
  balanceDue: number;      // 50% payable on pickup
  isDrawerOpen: boolean;
  addToCart: (product: Product, quantity?: number, customization?: CakeCustomization) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'giftagram_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to sync cart with localStorage', e);
    }
  }, [items]);

  const addToCart = (product: Product, quantity = 1, customization?: CakeCustomization) => {
    setItems((prevItems) => {
      // If customized, create distinct item ID based on timestamp or customization attributes
      if (customization) {
        const customId = `${product.id}-${Date.now()}`;
        const newItem: CartItem = {
          id: customId,
          productId: product.id,
          product,
          quantity,
          unitPrice: product.price,
          customization,
          subtotal: product.price * quantity,
          addedAt: Date.now(),
        };
        return [newItem, ...prevItems];
      }

      // Standard non-customized product: check if already exists
      const existingIndex = prevItems.findIndex(
        (item) => item.productId === product.id && !item.customization
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: existing.unitPrice * newQty,
        };
        return updated;
      }

      const newItem: CartItem = {
        id: `${product.id}-standard`,
        productId: product.id,
        product,
        quantity,
        unitPrice: product.price,
        subtotal: product.price * quantity,
        addedAt: Date.now(),
      };
      return [newItem, ...prevItems];
    });

    // Auto-open drawer when adding to cart
    setIsDrawerOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            subtotal: item.unitPrice * quantity,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const depositRequired = Math.round((subtotal * 0.5) * 100) / 100;
  const balanceDue = subtotal - depositRequired;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        depositRequired,
        balanceDue,
        isDrawerOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        toggleDrawer: () => setIsDrawerOpen((prev) => !prev),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export { useCart } from '../hooks/useCart';
