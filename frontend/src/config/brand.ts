/**
 * Brand Configuration & Asset Reference
 * 
 * IMPORTANT:
 * When the official brand logo is provided:
 * 1. Place the official logo file into `/public/images/logo.png` (or `.svg`)
 * 2. Update `BRAND_CONFIG.logo.imagePath` below and set `useImageLogo: true`.
 * The header and footer will automatically render your official brand asset with zero UI redesign!
 */

export interface BrandConfig {
  name: string;
  tagline: string;
  shortDescription: string;
  logo: {
    useImageLogo: boolean; // Set to true when real logo is dropped in
    imagePath: string;     // e.g. "/images/logo.png" or "/images/logo.svg"
    altText: string;
    width: {
      desktop: string;
      mobile: string;
    };
  };
  policy: {
    depositPercentage: number; // 50% non-refundable deposit
    minAdvanceDays: number;    // Notice period for orders
  };
}

export const BRAND_CONFIG: BrandConfig = {
  name: "GIFTAGRAM",
  tagline: "Little things, beautifully made.",
  shortDescription: "Thoughtfully crafted cakes, bouquets and bespoke gifts for life's sweetest celebrations.",
  logo: {
    useImageLogo: false, // Currently using clean, elegant text/SVG placeholder
    imagePath: "/images/logo.svg", // Drop official logo here
    altText: "GIFTAGRAM — Luxury Gifting & Bakery Studio",
    width: {
      desktop: "h-9 w-auto",
      mobile: "h-7 w-auto",
    },
  },
  policy: {
    depositPercentage: 50,
    minAdvanceDays: 2,
  },
};

/**
 * CONTACT CONFIGURATION
 * Edit these values to update contact information across the entire website.
 */
export interface ContactConfig {
  instagram: {
    handle: string;
    url: string;
  };
  whatsapp: {
    displayNumber: string;
    chatUrl: string;
  };
  phone: {
    displayNumber: string;
    telUrl: string;
  };
  email: {
    address: string;
    mailtoUrl: string;
  };
  pickup: {
    studioName: string;
    addressLine1: string;
    addressLine2: string;
    cityStateZip: string;
    pickupHours: string;
    googleMapsUrl?: string;
  };
}

export const CONTACT_CONFIG: ContactConfig = {
  instagram: {
    handle: "@giftagram_official",
    url: "https://instagram.com", // Configurable link
  },
  whatsapp: {
    displayNumber: "+91 81413 76677",
    chatUrl: "https://wa.me/918141376677?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20a%20custom%20gift",
  },
  phone: {
    displayNumber: "+91 81413 76677",
    telUrl: "tel:+918141376677",
  },
  email: {
    address: "hello@giftagram.studio",
    mailtoUrl: "mailto:hello@giftagram.studio",
  },
  pickup: {
    studioName: "The Giftagram Studio",
    addressLine1: "Boutique Studio & Kitchen",
    addressLine2: "Park Street Avenue",
    cityStateZip: "City Center — 400001",
    pickupHours: "Mon – Sun: 11:00 AM – 8:00 PM (By appointment)",
    googleMapsUrl: "https://maps.google.com",
  },
};
