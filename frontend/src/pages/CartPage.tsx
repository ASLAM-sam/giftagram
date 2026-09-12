import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../src/context/CartContext';
import { Button } from '../components/common/Button';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, ArrowLeft } from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    depositRequired,
    balanceDue,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-blush-100 flex items-center justify-center text-rose-500">
          <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <span className="font-script text-3xl text-rose-500 block">
            Awaiting sweetness
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium">
            Your basket is waiting for something beautiful.
          </h1>
          <p className="text-sm text-espresso-600 max-w-md mx-auto">
            Explore our curated 500g cakes and romantic floral bouquets crafted with devotion.
          </p>
        </div>
        <div className="pt-4 flex justify-center gap-4">
          <Link to="/cakes">
            <Button variant="primary" size="md">
              Explore Cakes
            </Button>
          </Link>
          <Link to="/bouquets">
            <Button variant="secondary" size="md">
              Explore Bouquets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-cream-300 pb-5">
        <div>
          <span className="font-script text-3xl text-rose-500 block">
            Your selection
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-medium">
            Shopping Basket ({itemCount})
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-espresso-600 hover:text-rose-600 underline underline-offset-4"
        >
          Clear entire basket
        </button>
      </div>

      {/* Grid: Left Items list, Right Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left items list */}
        <div className="lg:col-span-8 divide-y divide-cream-200">
          {items.map((item) => (
            <div key={item.id} className="py-6 first:pt-0 flex flex-col sm:flex-row gap-5">
              <img
                src={item.product.images[0]}
                alt={item.product.name}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-luxury border border-cream-200 shrink-0"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-xl font-medium text-espresso-900">
                      {item.product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {item.product.weight && (
                        <span className="text-xs bg-cream-200 text-espresso-800 px-2 py-0.5 rounded font-medium">
                          {item.product.weight}
                        </span>
                      )}
                      <span className="text-xs text-espresso-600">
                        ₹{item.unitPrice} per item
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-espresso-600 hover:text-rose-600 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Customization Details Box */}
                {item.customization && (
                  <div className="bg-blush-50/70 border border-rose-200/70 rounded-luxury p-3 text-xs text-espresso-800 space-y-1">
                    <p className="font-semibold text-rose-600 flex items-center gap-1">
                      <span>Customization Specifications</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[0.72rem]">
                      <p><span className="text-espresso-600">Recipient/Order Name:</span> {item.customization.fullName}</p>
                      <p><span className="text-espresso-600">Contact:</span> {item.customization.phoneNumber}</p>
                      <p><span className="text-espresso-600">Pickup Date:</span> {item.customization.pickupDate}</p>
                      <p><span className="text-espresso-600">Pickup Window:</span> {item.customization.pickupTime}</p>
                      {item.customization.lettering && (
                        <p className="sm:col-span-2"><span className="text-espresso-600">Message on Cake:</span> "{item.customization.lettering}"</p>
                      )}
                      {item.customization.colors && (
                        <p className="sm:col-span-2"><span className="text-espresso-600">Colors:</span> {item.customization.colors}</p>
                      )}
                      {item.customization.designRequirements && (
                        <p className="sm:col-span-2"><span className="text-espresso-600">Design Notes:</span> {item.customization.designRequirements}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Quantity and Subtotal Controls */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center border border-cream-300 rounded-full bg-cream-50">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-espresso-700 hover:text-rose-600 rounded-l-full"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs font-semibold text-espresso-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-espresso-700 hover:text-rose-600 rounded-r-full"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-serif text-lg font-semibold text-espresso-900">
                    ₹{item.subtotal}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-6">
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-xs text-espresso-700 hover:text-rose-600 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue browsing shop</span>
            </Link>
          </div>
        </div>

        {/* Right order summary */}
        <div className="lg:col-span-4 bg-[#FFFDF9] rounded-luxury-lg border border-cream-300 p-6 space-y-6 shadow-card">
          <h2 className="font-serif text-xl font-medium text-espresso-900 border-b border-cream-200 pb-3">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs text-espresso-800">
            <div className="flex justify-between">
              <span>Order Subtotal</span>
              <span className="font-semibold text-espresso-900">₹{subtotal}</span>
            </div>

            <div className="p-3.5 rounded-luxury bg-blush-50 border border-rose-200 space-y-1">
              <div className="flex justify-between font-semibold text-rose-600">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  50% Non-Refundable Deposit
                </span>
                <span>₹{depositRequired}</span>
              </div>
              <p className="text-[0.68rem] text-espresso-700">
                Required immediately to reserve bake time and confirm your order.
              </p>
            </div>

            <div className="flex justify-between text-espresso-600 pt-1 border-t border-cream-200 text-xs">
              <span>Remaining Balance (Pay on pickup)</span>
              <span>₹{balanceDue}</span>
            </div>
          </div>

          <Link to="/checkout" className="block w-full">
            <Button variant="primary" size="lg" fullWidth icon={<ArrowRight className="w-4 h-4" />}>
              Proceed to Checkout • ₹{depositRequired}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
