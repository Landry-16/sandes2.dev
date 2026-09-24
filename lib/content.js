/**
 * content.js: every word and link on the site lives here.
 *
 * Components only render this data, so adding a project or changing a link
 * never requires touching component code. Everything is plain serialisable
 * data (no JSX), which also lets the server components, the sitemap and the
 * JSON-LD block share the same source of truth.
 *
 * House style: short, sober sentences. No emojis, no em dashes.
 */

/** Public URL of the deployed site. Override with NEXT_PUBLIC_SITE_URL on Vercel. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sandes-tech.vercel.app').replace(/\/$/, '');

export const site = {
  name: 'Sandes',
  title: 'Sandes | Computer Science Student at EPITECH Paris',
  description: 'Portfolio of Sandes, computer science student at EPITECH Paris and literature enthusiast.',
  keywords: ['Sandes', 'EPITECH', 'EPITECH Paris', 'computer science', 'portfolio', 'literature', 'biotechnology'],
  locale: 'en_GB',
  themeColor: '#0f0f0f',
  repository: 'https://github.com/Landry-16/sandes2.dev',
};

export const person = {
  name: 'Sandes',
  role: 'Computer Science Student',
  school: 'EPITECH Paris',
  schoolUrl: 'https://www.epitech.eu',
  // TODO(sandes): confirm this is the address you want public.
  email: 'sandes.savarimuthu@epitech.eu',
  /** Used for structured data only. */
  knowsAbout: ['Computer science', 'C', 'C++', 'Cryptography', 'Literature', 'Biology'],
};

/** Hero (chapter I). */
export const hero = {
  eyebrow: 'EPITECH Paris',
  lede: 'Computer science student. Reader and writer.',
  primaryAction: { label: 'Projects', href: '#projects' },
  secondaryAction: { label: 'Contact', href: '#contact' },
  scrollCue: 'Scroll',
};

/**
 * Chapters, in page order. `id` is the DOM anchor and the key used by the
 * 3D scene (lib/sceneConfig.js) to decide where the camera goes.
 */
export const sections = [
  { id: 'prologue', numeral: 'I', label: 'Prologue' },
  { id: 'projects', numeral: 'II', label: 'Projects', title: 'My Works' },
  { id: 'about', numeral: 'III', label: 'About', title: 'Basicaly Me' },
  { id: 'contact', numeral: 'IV', label: 'Contact', title: 'Colophon' },
];

/** Project grid on the home page. */
export const projectsGrid = {
  /** Cards shown per filter; the rest live on the bookshelf page. */
  limit: 3,
  seeAll: { label: 'See all', href: '/bookshelf' },
  filters: [
    { value: 'all', label: 'All' },
    { value: 'academic', label: 'Academic' },
    { value: 'personal', label: 'Personal' },
  ],
};

/**
 * Projects. Order here is display order, on the home page and the bookshelf.
 *
 * - `category`: 'academic' | 'personal'
 * - `summary`: one short sentence, shown on cards
 * - `details`: optional, a little more for the bookshelf
 * - `links`: optional; each `{ label, href, kind: 'source' | 'live' }`
 * - `note`: shown when there are no public links; `private: true` adds a lock
 * - `image`: optional cover for the bookshelf, `{ src, alt }` (files in /public)
 */
export const projects = [
  {
    slug: 'raytracer',
    title: 'Raytracer',
    category: 'academic',
    year: 2026,
    summary: 'A physically based renderer in C++ with a path tracer and a plugin system.',
    details:
      'Two render engines, a recursive raytracer and a Monte Carlo path tracer, with a BVH, multithreaded tiles, a live preview and a denoising pass.',
    stack: ['C++17', 'SFML', 'ImGui'],
    links: [{ label: 'Source', href: 'https://github.com/Landry-16/Path-Tracer_Sandes_copy', kind: 'source' }],
    image: { src: '/projects/raytracer.webp', alt: 'Cornell box with a gold sphere, rendered by the path tracer' },
  },
  {
    slug: 'nous',
    title: 'Nous',
    category: 'personal',
    year: 2026,
    summary: 'A private app for two: memories, moods, notes and a shared map.',
    details: 'Built for my girlfriend. An installable web app with accounts, realtime sync and push notifications.',
    stack: ['React', 'TypeScript', 'Supabase'],
    links: [{ label: 'Source', href: 'https://github.com/Landry-16/nerdy-boyfriend-app', kind: 'source' }],
  },
  {
    slug: 'my-pgp',
    title: 'my_pgp',
    category: 'academic',
    year: 2026,
    summary: 'A PGP-like cryptosystem: XOR, AES, RSA and a combined PGP mode.',
    details: 'Cryptographic primitives written in C, with a Python command line on top.',
    stack: ['C', 'Python'],
    links: [],
    private: true,
    note: 'Private repository',
  },
  {
    slug: 'dreamlee',
    title: 'Dreamlee',
    category: 'personal',
    year: 2026,
    summary: 'A writing workspace for authors, from first idea to finished manuscript.',
    details: 'Notes, structure, characters, timeline, distraction-free writing and export, in one calm place. No AI at launch.',
    stack: ['Specification'],
    links: [],
    note: 'In design',
  },
  {
    slug: 'catchup',
    title: 'CatchUp',
    category: 'personal',
    year: 2026,
    summary: 'A learning app that maps what you know and guides you to your goal.',
    details: 'A personal knowledge map, explained corrections and regular review, at your own pace. Starting with maths.',
    stack: ['Specification'],
    links: [],
    note: 'In design',
  },
  {
    slug: 'cartepro',
    title: 'Cartepro',
    category: 'academic',
    year: 2026,
    summary: 'A dematerialised employee benefits platform for a fictional ministry.',
    // TODO(sandes): replace with the real stack once the project is final.
    stack: ['Team project'],
    links: [],
    private: true,
    note: 'Private repository',
  },
  {
    slug: 'sandes-v2',
    title: 'Sandes v2',
    category: 'personal',
    year: 2026,
    summary: 'This site: a 3D candlelit library.',
    stack: ['Next.js', 'Three.js'],
    links: [{ label: 'Source', href: 'https://github.com/Landry-16/sandes2.dev', kind: 'source' }],
  },
  {
    slug: 'sandes-dev-v1',
    title: 'sandes.dev v1',
    category: 'personal',
    year: 2026,
    summary: 'The first version of this portfolio.',
    stack: ['Next.js', 'CSS Modules'],
    links: [
      { label: 'Source', href: 'https://github.com/Landry-16/sandes.dev', kind: 'source' },
      { label: 'Visit', href: 'https://sandes-tech.vercel.app', kind: 'live' },
    ],
  },
];

/** Bookshelf page. */
export const bookshelf = {
  title: 'Bookshelf',
  back: { label: 'Back', href: '/#projects' },
  shelves: [
    { value: 'academic', label: 'Academic' },
    { value: 'personal', label: 'Personal' },
  ],
};

/** About (chapter III). Paragraphs are rendered in order. */
export const about = {
  lede: 'Literature enthusiast and computer science student.',
  paragraphs: [
    'I read and write a lot, and I want to make culture accessible to everyone. It is one of the reasons I started computer science.',
    'I also love biology, and would like to work in biotechnology one day.',
  ],
};

/** Contact (chapter IV). */
export const contact = {
  lede: 'Open to internships and collaborations.',
  // `icon` is a lucide-react icon name resolved in ContactSection.
  links: [
    { label: 'Mail', value: person.email, href: `mailto:${person.email}`, icon: 'Mail' },
    { label: 'GitHub', value: 'github.com/Landry-16', href: 'https://github.com/Landry-16', icon: 'CodeXml' },
    // TODO(sandes): add LinkedIn and a CV once the URLs exist, e.g.
    // { label: 'LinkedIn', value: 'linkedin.com/in/...', href: 'https://www.linkedin.com/in/...', icon: 'BriefcaseBusiness' },
    // { label: 'CV', value: 'Download (PDF)', href: '/cv.pdf', icon: 'FileText' },
  ],
};
