/**
 * /bookshelf: every project in one place.
 *
 * A first, simple version: a plain grid of all project cards, no 3D. The
 * home page shows only a few projects per category and links here.
 */
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { projects } from '@/lib/content';
import ProjectCard from '@/components/Common/ProjectCard';
import styles from './page.module.css';

export const metadata = {
  title: 'Bookshelf',
  description: 'All projects by Sandes.',
  alternates: { canonical: '/bookshelf' },
};

export default function BookshelfPage() {
  return (
    <main className={styles.page}>
      <Link className={`label ${styles.back}`} href="/#projects">
        <ArrowLeft size={14} aria-hidden="true" />
        Back
      </Link>

      <h1 className={styles.title}>Bookshelf</h1>

      <ul role="list" className={styles.grid}>
        {projects.map((project, index) => (
          <li key={project.slug} className={styles.item}>
            <ProjectCard project={project} index={index} />
          </li>
        ))}
      </ul>
    </main>
  );
}
