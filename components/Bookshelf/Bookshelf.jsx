'use client';

/**
 * Bookshelf: every project as a book on a shelf, one shelf per category.
 *
 * Picking a spine opens that book in the detail panel. The open book is
 * mirrored in the URL hash (/bookshelf#raytracer), so the project cards on
 * the home page can link straight to it and a visitor can share a link.
 * On narrow screens the shelves scroll sideways and the panel sits below;
 * choosing a book scrolls the panel into view.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { bookshelf, projects } from '@/lib/content';
import Spine from './Spine';
import BookDetail from './BookDetail';
import styles from './Bookshelf.module.css';

const bySlug = new Map(projects.map((project, index) => [project.slug, { project, index }]));

export default function Bookshelf() {
  const [selected, setSelected] = useState(projects[0].slug);
  const detailRef = useRef(null);

  // Open the book named in the URL hash, and follow later hash changes.
  useEffect(() => {
    const syncFromHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      if (bySlug.has(slug)) setSelected(slug);
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const select = useCallback((slug) => {
    setSelected(slug);
    window.history.replaceState(null, '', `#${slug}`);
    const panel = detailRef.current;
    if (panel && window.matchMedia('(max-width: 900px)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }, []);

  const current = bySlug.get(selected) ?? bySlug.get(projects[0].slug);

  return (
    <div className={styles.layout}>
      <div className={styles.shelves}>
        {bookshelf.shelves.map((shelf) => {
          const books = projects
            .map((project, index) => ({ project, index }))
            .filter(({ project }) => project.category === shelf.value);
          const headingId = `shelf-${shelf.value}`;
          return (
            <section key={shelf.value} className={styles.shelf} aria-labelledby={headingId}>
              <h2 id={headingId} className={`label ${styles.shelfLabel}`}>
                {shelf.label}
              </h2>
              <ul role="list" className={styles.row}>
                {books.map(({ project, index }) => (
                  <li key={project.slug}>
                    <Spine
                      project={project}
                      index={index}
                      selected={project.slug === current.project.slug}
                      onSelect={select}
                    />
                  </li>
                ))}
              </ul>
              <div className={styles.plank} aria-hidden="true" />
            </section>
          );
        })}
      </div>

      <BookDetail ref={detailRef} project={current.project} index={current.index} />
    </div>
  );
}
