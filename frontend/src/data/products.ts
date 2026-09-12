import { Product } from '../types';
import { CAKE_PRODUCTS } from './cakes';
import { BOUQUET_PRODUCTS } from './bouquets';

export const ALL_PRODUCTS: Product[] = [
  ...CAKE_PRODUCTS,
  ...BOUQUET_PRODUCTS,
];

export function getProductBySlug(slug: string): Product | undefined {
  return ALL_PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id);
}

export function getProductsByCategory(category: 'cakes' | 'bouquets'): Product[] {
  return ALL_PRODUCTS.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return ALL_PRODUCTS.filter((p) => p.featured);
}

export function searchProducts(query: string): Product[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];
  
  return ALL_PRODUCTS.filter((product) => {
    const matchName = product.name.toLowerCase().includes(clean);
    const matchCategory = product.category.toLowerCase().includes(clean);
    const matchDesc = product.shortDescription.toLowerCase().includes(clean);
    const matchTags = product.tags.some((tag) => tag.toLowerCase().includes(clean));
    const matchFlavor = product.flavorCategory?.toLowerCase().includes(clean);
    return matchName || matchCategory || matchDesc || matchTags || matchFlavor;
  });
}
