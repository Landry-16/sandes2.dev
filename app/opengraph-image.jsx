/**
 * Open Graph / social preview image, rendered at build time → /opengraph-image.
 * Next wires it into <meta property="og:image"> automatically.
 *
 * It tries to load Cormorant Garamond from Google Fonts for the title; if the
 * build machine is offline it falls back to the default font rather than
 * failing the build.
 */
import { ImageResponse } from 'next/og';
import { person, site } from '@/lib/content';

export const alt = `${site.name}, ${person.role} at ${person.school}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadDisplayFont() {
  try {
    const css = await fetch('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300', {
      // An old user agent makes Google serve TTF, which the image renderer needs.
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1)' },
    }).then((res) => res.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((res) => res.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const font = await loadDisplayFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at 50% 45%, #3a2e22 0%, #2b1f1f 45%, #0f0f0f 80%)',
          color: '#e8dcc8',
          fontFamily: font ? 'Cormorant' : 'serif',
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, textTransform: 'uppercase', color: '#c9a86b' }}>
          {person.school}
        </div>
        <div style={{ fontSize: 190, lineHeight: 1, marginTop: 18, fontWeight: 300 }}>{person.name}</div>
        <div style={{ marginTop: 26, width: 140, height: 1, background: '#c9a86b' }} />
        <div style={{ marginTop: 26, fontSize: 34, color: '#a89968' }}>Portfolio</div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: 'Cormorant', data: font, weight: 300, style: 'normal' }] : undefined,
    },
  );
}
