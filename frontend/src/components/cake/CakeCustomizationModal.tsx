import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, CakeCustomization } from '../../types';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { X, Calendar, Clock, ShieldCheck, Sparkles, Cake } from 'lucide-react';
import { Button } from '../common/Button';

interface CakeCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const CakeCustomizationModal: React.FC<CakeCustomizationModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { addToCart } = useCart();
  const { showToast } = useUI();

  // Minimum date: 2 days in advance
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);
  const minDateStr = minDate.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    pickupDate: minDateStr,
    pickupTime: '14:00',
    designRequirements: '',
    colors: '',
    lettering: '',
    additionalNotes: '',
    agreedToDeposit: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.phoneNumber.trim() || formData.phoneNumber.length < 10) {
      errs.phoneNumber = 'Please provide a valid 10-digit phone number';
    }
    if (!formData.pickupDate) errs.pickupDate = 'Pickup date is required';
    if (!formData.pickupTime) errs.pickupTime = 'Pickup time is required';
    if (!formData.designRequirements.trim()) {
      errs.designRequirements = 'Please describe your cake design or theme';
    }
    if (!formData.agreedToDeposit) {
      errs.agreedToDeposit = 'You must accept the 50% non-refundable deposit policy';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please complete all required fields and accept the deposit policy', 'error');
      return;
    }

    const customization: CakeCustomization = {
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      pickupDate: formData.pickupDate,
      pickupTime: formData.pickupTime,
      designRequirements: formData.designRequirements,
      colors: formData.colors || 'As pictured / Studio choice',
      lettering: formData.lettering || 'None',
      additionalNotes: formData.additionalNotes,
      agreedToDeposit: formData.agreedToDeposit,
    };

    addToCart(product, 1, customization);
    showToast(`Custom order for ${product.name} added to your basket!`);
    onClose();
  };

  const depositAmount = Math.round(product.price * 0.5);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-espresso-900/40 backdrop-blur-sm"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-xl bg-[#FFFDF9] rounded-luxury-lg shadow-modal border border-cream-300 overflow-hidden z-10 my-8 max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-cream-200 bg-cream-50/70 flex items-start justify-between">
              <div>
                <span className="text-[0.68rem] tracking-widest uppercase font-semibold text-rose-600 bg-blush-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Custom Cake Order
                </span>
                <h3 className="font-serif text-2xl text-espresso-900 font-medium mt-1">
                  Customize: {product.name}
                </h3>
                <p className="text-xs text-espresso-600">
                  Standard {product.weight || '500 g'} • Total: ₹{product.price}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-espresso-600 hover:text-espresso-900 hover:bg-cream-200 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mandatory Deposit Alert Banner */}
            <div className="bg-blush-50 px-5 sm:px-6 py-3 border-b border-rose-200/60 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-rose-500 shrink-0" />
              <div className="text-xs text-espresso-800">
                <span className="font-semibold text-rose-600">50% Non-Refundable Deposit: </span>
                A deposit of <span className="font-semibold">₹{depositAmount}</span> is required to secure your date and confirm your order.
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {/* Client Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-espresso-800 font-medium mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Alisha Sharma"
                    className={`w-full bg-white border rounded-lg px-3 py-2 text-espresso-900 placeholder:text-espresso-600/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 ${
                      errors.fullName ? 'border-rose-500' : 'border-cream-300'
                    }`}
                  />
                  {errors.fullName && <p className="text-rose-600 text-[0.7rem] mt-0.5">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-espresso-800 font-medium mb-1">
                    Phone Number (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="e.g. 8141376677"
                    className={`w-full bg-white border rounded-lg px-3 py-2 text-espresso-900 placeholder:text-espresso-600/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 ${
                      errors.phoneNumber ? 'border-rose-500' : 'border-cream-300'
                    }`}
                  />
                  {errors.phoneNumber && <p className="text-rose-600 text-[0.7rem] mt-0.5">{errors.phoneNumber}</p>}
                </div>
              </div>

              <div>
                <label className="block text-espresso-800 font-medium mb-1">
                  Email Address <span className="text-espresso-600/70 font-normal">(Optional, for receipt)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alisha@example.com"
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-espresso-900 placeholder:text-espresso-600/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                />
              </div>

              {/* Pickup Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-espresso-800 font-medium mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    Preferred Pickup Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={minDateStr}
                    value={formData.pickupDate}
                    onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                    className={`w-full bg-white border rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 ${
                      errors.pickupDate ? 'border-rose-500' : 'border-cream-300'
                    }`}
                  />
                  <p className="text-[0.68rem] text-espresso-600 mt-0.5">Minimum 48 hours notice required</p>
                </div>

                <div>
                  <label className="block text-espresso-800 font-medium mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    Preferred Pickup Time <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.pickupTime}
                    onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                  >
                    <option value="12:00">12:00 PM — 02:00 PM</option>
                    <option value="14:00">02:00 PM — 04:00 PM</option>
                    <option value="16:00">04:00 PM — 06:00 PM</option>
                    <option value="18:00">06:00 PM — 08:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Cake Design Specifications */}
              <div className="pt-1">
                <label className="block text-espresso-800 font-medium mb-1 flex items-center gap-1">
                  <Cake className="w-3.5 h-3.5 text-rose-500" />
                  Cake Design / Order Requirements <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.designRequirements}
                  onChange={(e) => setFormData({ ...formData, designRequirements: e.target.value })}
                  placeholder="Describe your desired theme, occasion (birthday, anniversary), piping style, or aesthetic..."
                  className={`w-full bg-white border rounded-lg p-3 text-espresso-900 placeholder:text-espresso-600/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 ${
                    errors.designRequirements ? 'border-rose-500' : 'border-cream-300'
                  }`}
                />
                {errors.designRequirements && (
                  <p className="text-rose-600 text-[0.7rem] mt-0.5">{errors.designRequirements}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-espresso-800 font-medium mb-1">
                    Preferred Color Palette
                  </label>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    placeholder="e.g. Blush pink, ivory, touches of gold"
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-espresso-900 placeholder:text-espresso-600/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                  />
                </div>

                <div>
                  <label className="block text-espresso-800 font-medium mb-1">
                    Lettering / Message on Cake
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={formData.lettering}
                    onChange={(e) => setFormData({ ...formData, lettering: e.target.value })}
                    placeholder="e.g. Happy 25th Alisha!"
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-espresso-900 placeholder:text-espresso-600/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-espresso-800 font-medium mb-1">
                  Additional Notes & Allergies
                </label>
                <input
                  type="text"
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  placeholder="e.g. Eggless preferred, no nuts"
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-espresso-900 placeholder:text-espresso-600/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                />
              </div>

              {/* Mandatory 50% Deposit Checkbox */}
              <div className="pt-2 border-t border-cream-200">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.agreedToDeposit}
                    onChange={(e) => setFormData({ ...formData, agreedToDeposit: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-rose-500 rounded border-cream-300 focus:ring-rose-400 cursor-pointer accent-rose-500"
                  />
                  <span className="text-xs text-espresso-800 leading-snug">
                    <span className="font-semibold text-rose-600">I understand and agree</span> that a{' '}
                    <span className="font-semibold">50% non-refundable deposit (₹{depositAmount})</span> is required to place and confirm my order. The remaining balance will be payable upon pickup.
                  </span>
                </label>
                {errors.agreedToDeposit && (
                  <p className="text-rose-600 text-[0.7rem] mt-1 pl-6">{errors.agreedToDeposit}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Confirm & Add to Basket (₹{depositAmount} deposit)
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
