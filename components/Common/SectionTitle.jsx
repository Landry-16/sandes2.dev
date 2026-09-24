/**
 * SectionTitle: a chapter heading. Rubricated eyebrow ("Chapter II"),
 * the real <h2>, and a gilded rule beneath.
 *
 * Server component (no interactivity). The `id` goes on the <h2> so the
 * parent <section> can reference it with aria-labelledby.
 *
 * @param {object} props
 * @param {string} props.id        id for the heading element
 * @param {string} props.eyebrow   e.g. "Chapter II"
 * @param {string} props.title     heading text
 * @param {'left'|'center'} [props.align]
 */
import clsx from 'clsx';
import Reveal from './Reveal';
import styles from './SectionTitle.module.css';

export default function SectionTitle({ id, eyebrow, title, align = 'left' }) {
  return (
    <Reveal className={clsx(styles.root, align === 'center' && styles.center)}>
      <p className={clsx('label', styles.eyebrow)}>{eyebrow}</p>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      <div className={styles.ornament} aria-hidden="true">
        <span className={styles.rule} />
        <span className={styles.lozenge} />
        <span className={styles.rule} />
      </div>
    </Reveal>
  );
}
