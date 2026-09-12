import React, { useState } from 'react';
import { CONTACT_CONFIG, BRAND_CONFIG } from '../config/brand';
import { useUI } from '../context/UIContext';
import { Button } from '../components/common/Button';
import { InstagramIcon } from '../components/common/InstagramIcon';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Send,
  Sparkles,
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { showToast } = useUI();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    occasion: 'birthday',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast("Thank you! We have received your inquiry and will reach out shortly.");
      setFormData({ name: '', phone: '', email: '', occasion: 'birthday', message: '' });
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="font-script text-4xl text-rose-500 block">
          Get in touch
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-espresso-900 font-medium">
          Have something special in mind?
        </h1>
        <p className="text-sm sm:text-base text-espresso-700 font-light leading-relaxed">
          Tell us what you're imagining and we'll help bring it to life.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Contact Channels & Studio Details */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-[#FFFDF9] rounded-luxury-lg border border-cream-300 p-6 sm:p-8 space-y-6 shadow-soft">
            <h3 className="font-serif text-2xl font-medium text-espresso-900 border-b border-cream-200 pb-3">
              Studio & Direct Inquiries
            </h3>

            <div className="space-y-5 text-xs text-espresso-800">
              {/* WhatsApp */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-blush-100 text-rose-500 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-espresso-900">WhatsApp Inquiries</p>
                  <a
                    href={CONTACT_CONFIG.whatsapp.chatUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-rose-600 hover:underline mt-0.5 block"
                  >
                    {CONTACT_CONFIG.whatsapp.displayNumber} (Chat with us)
                  </a>
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-blush-100 text-rose-500 flex items-center justify-center shrink-0">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-espresso-900">Instagram DM</p>
                  <a
                    href={CONTACT_CONFIG.instagram.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-rose-600 hover:underline mt-0.5 block"
                  >
                    {CONTACT_CONFIG.instagram.handle}
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-blush-100 text-rose-500 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-espresso-900">Phone</p>
                  <a
                    href={CONTACT_CONFIG.phone.telUrl}
                    className="text-rose-600 hover:underline mt-0.5 block"
                  >
                    {CONTACT_CONFIG.phone.displayNumber}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-blush-100 text-rose-500 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-espresso-900">Email</p>
                  <a
                    href={CONTACT_CONFIG.email.mailtoUrl}
                    className="text-rose-600 hover:underline mt-0.5 block"
                  >
                    {CONTACT_CONFIG.email.address}
                  </a>
                </div>
              </div>

              {/* Studio Location & Hours */}
              <div className="flex items-start gap-3.5 pt-3 border-t border-cream-200">
                <div className="w-9 h-9 rounded-full bg-cream-200 text-espresso-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-espresso-900">Studio Pickup Location</p>
                  <p className="text-espresso-600 mt-0.5">{CONTACT_CONFIG.pickup.studioName}</p>
                  <p className="text-espresso-600">{CONTACT_CONFIG.pickup.addressLine1}, {CONTACT_CONFIG.pickup.addressLine2}</p>
                  <p className="text-espresso-600">{CONTACT_CONFIG.pickup.cityStateZip}</p>
                  <p className="text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{CONTACT_CONFIG.pickup.pickupHours}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Custom Inquiry Form */}
        <div className="lg:col-span-7 bg-[#FFFDF9] rounded-luxury-lg border border-cream-300 p-6 sm:p-8 shadow-soft">
          <div className="space-y-2 mb-6 border-b border-cream-200 pb-4">
            <span className="text-[0.68rem] uppercase tracking-widest text-rose-600 font-semibold bg-blush-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Bespoke Inquiry
            </span>
            <h3 className="font-serif text-2xl font-medium text-espresso-900">
              Send us a Message
            </h3>
            <p className="text-xs text-espresso-600">
              Planning a celebration, special bouquet arrangement, or custom corporate gift? Write to us below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-espresso-800 font-medium mb-1">
                  Your Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alisha Sharma"
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2.5 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                />
              </div>

              <div>
                <label className="block text-espresso-800 font-medium mb-1">
                  Phone Number (WhatsApp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 8141376677"
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2.5 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-espresso-800 font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alisha@example.com"
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2.5 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                />
              </div>

              <div>
                <label className="block text-espresso-800 font-medium mb-1">
                  Occasion Type
                </label>
                <select
                  value={formData.occasion}
                  onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2.5 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                >
                  <option value="birthday">Birthday Celebration</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="wedding">Wedding / Trousseau</option>
                  <option value="proposal">Proposal Bouquet</option>
                  <option value="corporate">Corporate / PR Gifting</option>
                  <option value="other">Other Special Moment</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-espresso-800 font-medium mb-1">
                Tell us about your celebration <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Share your preferred dates, flavour ideas, bouquet sizes, or special wishes..."
                className="w-full bg-white border border-cream-300 rounded-lg p-3 text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                icon={<Send className="w-4 h-4" />}
              >
                Send Message
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
