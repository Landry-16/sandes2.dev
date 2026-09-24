/**
 * AboutSection: chapter III.
 *
 * A short biography on the left. The right-hand column is left empty on
 * purpose so the 3D still life (AboutScene: book stack, candle, circling
 * quill) shows through. Everything meaningful is in the HTML; the scene is
 * decoration only.
 */
import { about, sections } from '@/lib/content';
import SectionTitle from '@/components/Common/SectionTitle';
import Reveal from '@/components/Common/Reveal';
import styles from './AboutSection.module.css';

const chapter = sections.find((section) => section.id === 'about');

export default function AboutSection() {
  return (
    <section id="about" className={styles.section} aria-labelledby="about-title">
      <div className={styles.inner}>
        <div className={styles.text}>
          <SectionTitle id="about-title" eyebrow={`Chapter ${chapter.numeral}`} title={chapter.title} />

          <Reveal delay={0.1}>
            <p className={styles.lede}>{about.lede}</p>
          </Reveal>

          {about.paragraphs.map((paragraph, i) => (
            <Reveal key={i} delay={0.15 + i * 0.08}>
              <p className={styles.paragraph}>{paragraph}</p>
            </Reveal>
          ))}

        </div>
        <div className={styles.stage} aria-hidden="true" />
      </div>
    </section>
  );
}
