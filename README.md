# Sandes v2

A portfolio set in a dark, candlelit library. Books, quills and dust drift in 3D
behind the page and react to scrolling and to the mouse. All content stays plain,
accessible HTML.

Built with Next.js 14, React Three Fiber, GSAP, Framer Motion and Zustand.

- Design: [Figma](https://www.figma.com/design/eDYj4XxaOtzBY02i80txt5)
- Previous version: [sandes-tech.vercel.app](https://sandes-tech.vercel.app)

## Getting started

```bash
npm install
npm run dev
```

| Script          | Description                        |
| --------------- | ---------------------------------- |
| `npm run dev`   | Development server                 |
| `npm run build` | Production build (runs ESLint too) |
| `npm run start` | Serve the production build         |
| `npm run lint`  | ESLint                             |

Node 18.17 or newer. On Vercel, set `NEXT_PUBLIC_SITE_URL` to the final domain.

Development helpers:

- `/#debug` (dev only) opens a Leva panel to tune the 3D scene live.
- `/?quality=high|medium|low` forces a quality tier.

## Content

All text and links live in `lib/content.js`. To add a project, append an entry
to `projects`:

```js
{
  slug: 'my-project',
  title: 'My project',
  category: 'personal', // 'academic' | 'personal'
  year: 2026,
  summary: 'One short sentence.',
  stack: ['C'],
  links: [{ label: 'Source', href: 'https://github.com/...', kind: 'source' }],
}
```

The home page shows three projects per category. `/bookshelf` shows them all as
books on shelves; `/bookshelf#slug` opens a specific one. Optional fields:
`details` (longer text for the bookshelf), `image` (a cover in `public/`) and
`private` (adds a lock to the note).

## How the 3D works

One WebGL canvas sits behind the page. The 3D world is a vertical shaft with one
small scene per chapter, and the camera moves down it as you scroll.

```
y =   0   HeroScene     drifting books and quills, god rays
y = -14   ProjectScene  a ring of books behind the cards
y = -28   AboutScene    a desk, a stack of books, a candle
y = -42   ContactScene  one closed book
```

- **Shared state.** One scroll listener and one pointer listener write into a
  Zustand store (`lib/store.js`). The scene reads it inside `useFrame` with
  `getState()`, so mouse moves never re-render React.
- **Animation.** `useFrame` handles per-frame motion, GSAP ScrollTrigger drives
  the camera, Framer Motion handles DOM reveals and card tilt, and CSS handles
  the hero entrance.
- **Performance.** Books and particles use `InstancedMesh`. The 3D chunk is
  prefetched after load and mounted on the first interaction, so the page is
  interactive before any 3D runs. Quality tiers (`QUALITY` in
  `lib/sceneConfig.js`) reduce particles, books and effects on small or slow
  devices, and drop further if the frame rate falls.
- **Reduced motion.** With `prefers-reduced-motion`, the scene is static and
  the camera cuts between chapters.

Every tunable value is in `lib/sceneConfig.js`.

## Structure

```
app/          layout, page, bookshelf, styles, fonts, SEO files
components/
  Scenes/     WebGL scene
  Sections/   Hero, Projects, About, Contact
  Common/     ProjectCard, SectionTitle, Reveal
  Bookshelf/  shelves, spines and the open book
lib/          content, scene config, store, hooks, utils
```

## Fonts

Cormorant Garamond and EB Garamond, under the SIL Open Font License 1.1 (see
`app/fonts/`).
