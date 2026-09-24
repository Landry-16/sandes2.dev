/**
 * BookDetail: the open book beside the shelves, showing the selected
 * project as a two-page spread.
 *
 * A polite live region announces the title when another spine is picked.
 * Keying the spread by slug replays the page-turn fade on every change.
 *
 * @param {object} props
 * @param {object} props.project  entry from lib/content.js
 * @param {number} props.index    position in the full list (folio number)
 */
import { forwardRef } from 'react';
import Image from 'next/image';
import { ArrowUpRight, CodeXml, Lock, PenLine } from 'lucide-react';
import { toRoman } from '@/lib/utils';
import styles from './Bookshelf.module.css';

const LINK_ICONS = { source: CodeXml, live: ArrowUpRight };

const BookDetail = forwardRef(function BookDetail({ project, index }, ref) {
  return (
    <article id="book-detail" ref={ref} className={styles.book} aria-labelledby="book-title">
      <p className="visually-hidden" aria-live="polite">
        {project.title}
      </p>
      <div key={project.slug} className={styles.spread}>
        <div className={styles.page}>
          <p className={`label ${styles.meta}`}>
            <span>Folio {toRoman(index + 1)}</span>
            <span>
              {project.category} · {project.year}
            </span>
          </p>
          <h2 id="book-title" className={styles.bookTitle}>
            {project.title}
          </h2>
          <p>{project.summary}</p>
          {project.details && <p className={styles.details}>{project.details}</p>}
        </div>

        <div className={styles.page}>
          {project.image && (
            <Image
              className={styles.cover}
              src={project.image.src}
              alt={project.image.alt}
              width={800}
              height={600}
              sizes="(max-width: 900px) 90vw, 280px"
            />
          )}
          <h3 className={`label ${styles.pageLabel}`}>Stack</h3>
          <ul role="list" className={styles.stack}>
            {project.stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className={styles.links}>
            {project.links?.length ? (
              project.links.map((link) => {
                const Icon = LINK_ICONS[link.kind] ?? ArrowUpRight;
                return (
                  <a key={link.href} className="label" href={link.href} target="_blank" rel="noopener noreferrer">
                    <Icon size={14} aria-hidden="true" />
                    {link.label}
                    <span className="visually-hidden"> {project.title} (opens in a new tab)</span>
                  </a>
                );
              })
            ) : (
              <span className={styles.note}>
                {project.private ? <Lock size={13} aria-hidden="true" /> : <PenLine size={13} aria-hidden="true" />}
                {project.note}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

export default BookDetail;
