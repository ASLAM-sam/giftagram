export interface NavLink {
  label: string;
  href: string;
  badge?: string;
}

export const MAIN_NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Cakes", href: "/cakes" },
  { label: "Bouquets", href: "/bouquets" },
  { label: "Coming Soon", href: "/coming-soon", badge: "Future" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_NAV_LINKS = {
  shop: [
    { label: "All Products", href: "/shop" },
    { label: "Cakes (500g)", href: "/cakes" },
    { label: "Bouquets & Roses", href: "/bouquets" },
    { label: "Custom Cake Orders", href: "/cakes" },
  ],
  future: [
    { label: "Cupcakes", href: "/coming-soon" },
    { label: "Bento Cakes", href: "/coming-soon" },
    { label: "Gift Hampers", href: "/coming-soon" },
    { label: "Trousseau", href: "/coming-soon" },
    { label: "Frames & Keepsakes", href: "/coming-soon" },
    { label: "PR & Preeties", href: "/coming-soon" },
  ],
  company: [
    { label: "Our Story", href: "/about" },
    { label: "Contact & Studio", href: "/contact" },
    { label: "Order & Deposit Guide", href: "/refund-policy" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund & 50% Deposit Policy", href: "/refund-policy" },
  ],
};
