/**
 * Root layout: fonts, global CSS and site-wide metadata.
 *
 * Fonts are committed to the repo (app/fonts, OFL-1.1, latin subset from
 * Fontsource) and loaded with next/font/local: no request to Google at build
 * or run time, automatic preloading, and size-adjusted fallbacks so the swap
 * causes no layout shift. They are exposed as CSS variables consumed by
 * app/styles/variables.css.
 */
import localFont from 'next/font/local';
import { SITE_URL, person, site } from '@/lib/content';
import './globals.css';

/** Display face, headings, lede, italic flourishes. */
const cormorant = localFont({
  src: [
    { path: './fonts/cormorant-garamond-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './fonts/cormorant-garamond-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/cormorant-garamond-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/cormorant-garamond-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-cormorant',
  fallback: ['Georgia', 'serif'],
});

/** Text face, body copy and small-caps labels. */
const garamond = localFont({
  src: [
    { path: './fonts/eb-garamond-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/eb-garamond-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/eb-garamond-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-garamond',
  fallback: ['Georgia', 'serif'],
});

/** @type {import('next').Metadata} */
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: site.title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: site.keywords,
  authors: [{ name: person.name, url: SITE_URL }],
  creator: person.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'profile',
    url: '/',
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: site.locale,
    firstName: person.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: site.title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  formatDetection: { email: false, telephone: false },
};

/** @type {import('next').Viewport} */
export const viewport = {
  themeColor: site.themeColor,
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${garamond.variable}`}>
      <body>
        {/* Without JavaScript, Framer Motion never runs: show revealed content. */}
        <noscript>
          <style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
