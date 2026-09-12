import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { BRAND_CONFIG, CONTACT_CONFIG } from '../../config/brand';
import { FOOTER_NAV_LINKS } from '../../config/navigation';
import { InstagramIcon } from '../common/InstagramIcon';
import { Phone, MessageCircle, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FAF7F2] border-t border-cream-300 text-espresso-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-14">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4 pr-0 lg:pr-8">
            <Logo isFooter />
            <p className="text-sm text-espresso-700 leading-relaxed max-w-sm mt-3">
              {BRAND_CONFIG.shortDescription}
            </p>
            <p className="font-serif italic text-base text-rose-600">
              "{BRAND_CONFIG.tagline}"
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={CONTACT_CONFIG.instagram.url}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-cream-100 hover:bg-blush-100 border border-cream-300 flex items-center justify-center text-espresso-800 hover:text-rose-600 transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href={CONTACT_CONFIG.whatsapp.chatUrl}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-cream-100 hover:bg-blush-100 border border-cream-300 flex items-center justify-center text-espresso-800 hover:text-rose-600 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={CONTACT_CONFIG.email.mailtoUrl}
                className="w-9 h-9 rounded-full bg-cream-100 hover:bg-blush-100 border border-cream-300 flex items-center justify-center text-espresso-800 hover:text-rose-600 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href={CONTACT_CONFIG.phone.telUrl}
                className="w-9 h-9 rounded-full bg-cream-100 hover:bg-blush-100 border border-cream-300 flex items-center justify-center text-espresso-800 hover:text-rose-600 transition-colors"
                aria-label="Phone"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Shop Catalog */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-semibold text-espresso-900 tracking-wide uppercase">
              Current Menu
            </h4>
            <ul className="space-y-2 text-xs">
              {FOOTER_NAV_LINKS.shop.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-espresso-700 hover:text-rose-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Coming Soon Categories */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-semibold text-espresso-900 tracking-wide uppercase flex items-center gap-1.5">
              <span>Coming Soon</span>
              <span className="text-[0.62rem] bg-blush-100 text-rose-600 px-1.5 py-0.5 rounded font-sans uppercase">
                Future
              </span>
            </h4>
            <ul className="space-y-2 text-xs">
              {FOOTER_NAV_LINKS.future.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-espresso-700 hover:text-rose-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Studio & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-semibold text-espresso-900 tracking-wide uppercase">
              Studio & Care
            </h4>
            <ul className="space-y-2 text-xs">
              {FOOTER_NAV_LINKS.company.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-espresso-700 hover:text-rose-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {FOOTER_NAV_LINKS.legal.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-espresso-600 hover:text-rose-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="pt-2 text-[0.7rem] text-espresso-600 space-y-1">
              <p className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{CONTACT_CONFIG.pickup.addressLine2}, {CONTACT_CONFIG.pickup.cityStateZip}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & 50% deposit policy notice */}
        <div className="pt-8 border-t border-cream-300/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-espresso-600">
          <p>
            © {new Date().getFullYear()} {BRAND_CONFIG.name}. All rights reserved. Handcrafted with love.
          </p>
          <p className="text-[0.7rem] text-espresso-600/90 text-center md:text-right">
            Note: A 50% non-refundable deposit is required to confirm custom cake orders.
          </p>
        </div>
      </div>
    </footer>
  );
};
