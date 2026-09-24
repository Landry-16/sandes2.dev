/**
 * HeroSection: chapter I, the prologue.
 *
 * A server component: the title and intro are plain HTML, so they are the
 * page's Largest Contentful Paint and are visible before any JavaScript
 * runs. The entrance ("ink settling" on the title, a staggered rise for the
 * rest) is pure CSS for the same reason; animating the LCP element with JS
 * would delay it. The 3D scene appears behind this content once loaded.
 */
import { ArrowDown } from 'lucide-react';
import { hero, person } from '@/lib/content';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  return (
    <section id="prologue" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.content}>
        <p className={`label ${styles.eyebrow}`}>{hero.eyebrow}</p>

        <h1 id="hero-title" className={styles.title}>
          {person.name}
        </h1>

        <p className={styles.lede}>{hero.lede}</p>

        <div className={styles.actions}>
          <a className={`label ${styles.primary}`} href={hero.primaryAction.href}>
            {hero.primaryAction.label}
          </a>
          <a className={`label ${styles.secondary}`} href={hero.secondaryAction.href}>
            {hero.secondaryAction.label}
          </a>
        </div>
      </div>

      <a className={`label ${styles.cue}`} href="#projects">
        {hero.scrollCue}
        <ArrowDown size={14} aria-hidden="true" />
      </a>
    </section>
  );
}
