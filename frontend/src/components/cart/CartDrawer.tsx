import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';

export const CartDrawer: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    depositRequired,
    balanceDue,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeFromCart,
  } = useCart();

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-espresso-900/35 backdrop-blur-sm"
          />

          {/* Slide-in Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-screen max-w-md bg-[#FFFDF9] shadow-modal flex flex-col justify-between border-l border-cream-300"
            >
              {/* Header */}
              <div className="p-5 border-b border-cream-200 flex items-center justify-between bg-cream-50/60">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-rose-500" />
                  <h3 className="font-serif text-xl font-medium text-espresso-900">
                    Your Basket ({itemCount})
                  </h3>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-full text-espresso-600 hover:text-espresso-900 hover:bg-cream-200 transition-colors"
                  aria-label="Close basket"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blush-100 flex items-center justify-center text-rose-500">
                      <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <h4 className="font-serif text-2xl text-espresso-900 mb-2 font-medium">
                      Your basket is waiting for something beautiful.
                    </h4>
                    <p className="text-xs text-espresso-600 mb-6 max-w-xs mx-auto leading-relaxed">
                      Discover our handcrafted 500g cakes and romantic bouquets made with devotion.
                    </p>
                    <Link to="/cakes" onClick={closeDrawer}>
                      <Button variant="primary" size="md">
                        Explore Cakes
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-cream-200">
                    {items.map((item) => (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-3.5">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-luxury border border-cream-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-serif text-base font-medium text-espresso-900 leading-snug">
                                {item.product.name}
                              </h5>
                              <div className="flex items-center gap-2 mt-0.5">
                                {item.product.weight && (
                                  <span className="text-[0.68rem] bg-cream-200 text-espresso-700 px-1.5 py-0.5 rounded font-medium">
                                    {item.product.weight}
                                  </span>
                                )}
                                <span className="text-xs text-espresso-600">
                                  ₹{item.unitPrice} each
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-espresso-600/70 hover:text-rose-600 p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Customization Details preview if customized */}
                          {item.customization && (
                            <div className="mt-2 text-[0.72rem] bg-blush-50/80 border border-rose-200/60 rounded-md p-2 text-espresso-700 space-y-0.5">
                              <p className="font-semibold text-rose-600">Custom Cake Order:</p>
                              <p className="truncate"><span className="text-espresso-600">Pickup:</span> {item.customization.pickupDate} at {item.customization.pickupTime}</p>
                              {item.customization.lettering && (
                                <p className="truncate"><span className="text-espresso-600">Message:</span> "{item.customization.lettering}"</p>
                              )}
                              {item.customization.colors && (
                                <p className="truncate"><span className="text-espresso-600">Palette:</span> {item.customization.colors}</p>
                              )}
                            </div>
                          )}

                          {/* Quantity selector and subtotal */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-cream-300 rounded-full bg-cream-50">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center text-espresso-700 hover:text-rose-600 rounded-l-full"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-semibold text-espresso-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center text-espresso-700 hover:text-rose-600 rounded-r-full"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-serif text-sm font-semibold text-espresso-900">
                              ₹{item.subtotal}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Summary with 50% Deposit Breakdown */}
              {items.length > 0 && (
                <div className="p-5 border-t border-cream-200 bg-cream-50/80 space-y-3">
                  <div className="space-y-1.5 text-xs text-espresso-700">
                    <div className="flex justify-between">
                      <span>Order Subtotal</span>
                      <span className="font-medium text-espresso-900">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-medium pt-1 border-t border-cream-200">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                        50% Non-Refundable Deposit Required
                      </span>
                      <span>₹{depositRequired}</span>
                    </div>
                    <div className="flex justify-between text-espresso-600 text-[0.72rem]">
                      <span>Remaining Balance (Due on pickup)</span>
                      <span>₹{balanceDue}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Link to="/checkout" onClick={closeDrawer} className="w-full">
                      <Button variant="primary" size="md" fullWidth icon={<ArrowRight className="w-4 h-4" />}>
                        Proceed to Checkout • ₹{depositRequired} deposit
                      </Button>
                    </Link>
                    <Link
                      to="/cart"
                      onClick={closeDrawer}
                      className="text-center text-xs text-espresso-600 hover:text-rose-600 underline underline-offset-4 py-1"
                    >
                      View Full Basket Details
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
