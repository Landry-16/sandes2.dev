import { SITE_URL } from '@/lib/content';

/**
 * Generated at build time → /sitemap.xml.
 * @returns {import('next').MetadataRoute.Sitemap}
 */
export default function sitemap() {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/bookshelf`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
