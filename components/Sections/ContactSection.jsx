/**
 * ContactSection: chapter IV, the "Colophon".
 *
 * A calm closing section: a sentence of invitation and a list of contact
 * links from lib/content.js. Icons are lucide-react components looked up by
 * name, so content.js stays plain data.
 */
import { ArrowUpRight, BriefcaseBusiness, CodeXml, FileText, Mail } from 'lucide-react';
import { contact, sections } from '@/lib/content';
import SectionTitle from '@/components/Common/SectionTitle';
import Reveal from '@/components/Common/Reveal';
import styles from './ContactSection.module.css';

const ICONS = { Mail, CodeXml, BriefcaseBusiness, FileText };
const chapter = sections.find((section) => section.id === 'contact');

export default function ContactSection() {
  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      <div className={styles.inner}>
        <SectionTitle id="contact-title" eyebrow={`Chapter ${chapter.numeral}`} title={chapter.title} />

        <Reveal delay={0.1}>
          <p className={styles.lede}>{contact.lede}</p>
        </Reveal>

        <Reveal delay={0.2}>
          <ul role="list" className={styles.links}>
            {contact.links.map((link) => {
              const Icon = ICONS[link.icon] ?? ArrowUpRight;
              const external = link.href.startsWith('http');
              return (
                <li key={link.label}>
                  <a
                    className={styles.link}
                    href={link.href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <span className={`label ${styles.label}`}>
                      <Icon size={15} aria-hidden="true" />
                      {link.label}
                    </span>
                    <span className={styles.value}>{link.value}</span>
                    <ArrowUpRight className={styles.arrow} size={20} aria-hidden="true" />
                    {external && <span className="visually-hidden"> (opens in a new tab)</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
