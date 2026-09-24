'use client';

/**
 * ProjectCard: one "folio" in the reading room.
 *
 * Hover / focus:
 *   - the card tilts toward the pointer in 3D (≤ 6°) using Framer Motion
 *     springs, so it settles smoothly instead of snapping;
 *   - the border gilds and a candle glow appears (CSS);
 *   - `hoveredProject` is set in the store, and the WebGL scene behind
 *     responds: the book ring speeds up and the candle brightens.
 *
 * Pointer maths is done in motion values, not React state, so moving the
 * mouse over a card never re-renders it. Tilt is skipped for touch input and
 * for users who prefer reduced motion.
 *
 * @param {object} props
 * @param {object} props.project  entry from lib/content.js → projects
 * @param {number} props.index    position in the full list (folio number + store id)
 *
 * The title links to the project's page on the bookshelf.
 */
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, CodeXml, Lock, PenLine } from 'lucide-react';
import { useStore } from '@/lib/store';
import { toRoman } from '@/lib/utils';
import styles from './ProjectCard.module.css';

const MAX_TILT = 6; // degrees
const SPRING = { stiffness: 160, damping: 18, mass: 0.6 };

const LINK_ICONS = { source: CodeXml, live: ArrowUpRight };

export default function ProjectCard({ project, index }) {
  const reduceMotion = useReducedMotion();
  const setHoveredProject = useStore((state) => state.setHoveredProject);

  // Pointer position over the card, normalised to [-0.5, 0.5].
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [MAX_TILT, -MAX_TILT]), SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-MAX_TILT, MAX_TILT]), SPRING);

  const handleMove = (event) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const activate = () => setHoveredProject(index);
  const deactivate = () => {
    px.set(0);
    py.set(0);
    setHoveredProject(null);
  };

  const titleId = `project-${project.slug}`;

  return (
    <m.article
      className={styles.card}
      aria-labelledby={titleId}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={handleMove}
      onPointerEnter={activate}
      onPointerLeave={deactivate}
      onFocus={activate}
      onBlur={deactivate}
    >
      <header className={styles.meta}>
        <span className="label">Folio {toRoman(index + 1)}</span>
        <span className={`label ${styles.category}`}>
          {project.category} · {project.year}
        </span>
      </header>
      <span className={styles.rule} aria-hidden="true" />

      <h3 id={titleId} className={styles.title}>
        <Link href={`/bookshelf#${project.slug}`} className={styles.titleLink}>
          {project.title}
        </Link>
      </h3>
      <p className={styles.summary}>{project.summary}</p>

      <ul role="list" className={styles.stack} aria-label="Technologies">
        {project.stack.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <footer className={styles.links}>
        {project.links?.length ? (
          project.links.map((link) => {
            const Icon = LINK_ICONS[link.kind] ?? ArrowUpRight;
            return (
              <a key={link.href} className={`label ${styles.link}`} href={link.href} target="_blank" rel="noopener noreferrer">
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
      </footer>
    </m.article>
  );
}
