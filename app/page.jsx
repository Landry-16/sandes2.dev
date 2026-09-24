/**
 * The home page. A server component: it composes the four chapters inside
 * the client-side Portfolio shell and emits JSON-LD structured data so
 * search engines understand this is a person's portfolio.
 */
import Portfolio from '@/components/Portfolio';
import HeroSection from '@/components/Sections/HeroSection';
import ProjectsSection from '@/components/Sections/ProjectsSection';
import AboutSection from '@/components/Sections/AboutSection';
import ContactSection from '@/components/Sections/ContactSection';
import { SITE_URL, contact, person, projects, site } from '@/lib/content';

/** schema.org graph: the site, the profile page, the person and their work. */
function structuredData() {
  const personId = `${SITE_URL}/#person`;
  const sameAs = contact.links.map((link) => link.href).filter((href) => href.startsWith('http'));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: site.name,
        description: site.description,
        inLanguage: 'en',
        author: { '@id': personId },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${SITE_URL}/#profile`,
        url: SITE_URL,
        name: site.title,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        mainEntity: { '@id': personId },
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: person.name,
        url: SITE_URL,
        email: `mailto:${person.email}`,
        jobTitle: person.role,
        affiliation: { '@type': 'CollegeOrUniversity', name: person.school, url: person.schoolUrl },
        address: { '@type': 'PostalAddress', addressLocality: 'Paris', addressCountry: 'FR' },
        knowsAbout: person.knowsAbout,
        sameAs,
      },
      ...projects.map((project) => ({
        '@type': 'CreativeWork',
        name: project.title,
        description: project.summary,
        dateCreated: String(project.year),
        keywords: project.stack.join(', '),
        creator: { '@id': personId },
        ...(project.links?.[0] ? { url: project.links[0].href } : {}),
      })),
    ],
  };
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // Content is our own static data, serialised by JSON.stringify.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()).replace(/</g, '\\u003c') }}
      />
      <Portfolio>
        <HeroSection />
        <ProjectsSection />
        <AboutSection />
        <ContactSection />
      </Portfolio>
    </>
  );
}
