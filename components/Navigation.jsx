'use client';

/**
 * Navigation: the fixed table of contents.
 *
 * The current chapter is highlighted from `activeSection` in the store. The
 * selector subscribes to that single string, so this component re-renders a
 * handful of times per visit rather than on every scroll event. The same
 * trick gives the "scrolled" state: the selector returns a boolean, and
 * React only re-renders when it flips.
 *
 * Under 720px the links collapse into a "Contents" disclosure button with
 * proper aria-expanded / aria-controls wiring and Escape to close.
 */
import { useEffect, useId, useState } from 'react';
import clsx from 'clsx';
import { Menu, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { sections, site } from '@/lib/content';
import styles from './Navigation.module.css';

export default function Navigation() {
  const activeSection = useStore((state) => state.activeSection);
  const scrolled = useStore((state) => state.scroll.y > 24);
  const [open, setOpen] = useState(false);
  const menuId = useId();

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={clsx(styles.header, scrolled && styles.scrolled)}>
      <a className={styles.brand} href="#prologue">
        <span className={styles.monogram} aria-hidden="true">
          {site.name.charAt(0)}
        </span>
        <span className={styles.brandName}>{site.name}</span>
        <span className="visually-hidden">, back to the top</span>
      </a>

      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        <span>Contents</span>
      </button>

      <nav id={menuId} className={clsx(styles.nav, open && styles.open)} aria-label="Chapters">
        <ul role="list" className={styles.list}>
          {sections.map((section) => {
            const current = activeSection === section.id;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={clsx(styles.link, current && styles.current)}
                  aria-current={current ? 'location' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className={styles.numeral} aria-hidden="true">
                    {section.numeral} ·
                  </span>{' '}
                  {section.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
