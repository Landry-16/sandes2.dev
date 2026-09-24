import { SITE_URL } from '@/lib/content';

/**
 * Generated at build time → /robots.txt.
 * @returns {import('next').MetadataRoute.Robots}
 */
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
