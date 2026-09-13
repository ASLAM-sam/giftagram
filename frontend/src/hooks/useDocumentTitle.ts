import { useEffect } from 'react';

/**
 * Custom hook to update document title dynamically on route changes
 * @param title - The page title (e.g. "Artisan Cakes | Giftagram")
 * @param description - Optional meta description
 */
export function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = title.includes('Giftagram') ? title : `${title} | Giftagram`;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    return () => {
      document.title = originalTitle;
    };
  }, [title, description]);
}
