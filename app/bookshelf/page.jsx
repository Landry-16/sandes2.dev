/**
 * /bookshelf: every project, as books on a shelf.
 *
 * The page shell (heading, back link) is server-rendered; the interactive
 * shelf is the Bookshelf client component. All project text is in the
 * initial HTML, so the page is fully crawlable.
 */
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { bookshelf, projects } from '@/lib/content';
import Bookshelf from '@/components/Bookshelf/Bookshelf';
import styles from './page.module.css';

export const metadata = {
  title: 'Bookshelf',
  description: 'All projects by Sandes.',
  alternates: { canonical: '/bookshelf' },
};

export default function BookshelfPage() {
  return (
    <main className={styles.page}>
      <Link className={`label ${styles.back}`} href={bookshelf.back.href}>
        <ArrowLeft size={14} aria-hidden="true" />
        {bookshelf.back.label}
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{bookshelf.title}</h1>
        <p className={styles.count}>{projects.length} volumes</p>
      </header>

      <Bookshelf />
    </main>
  );
}
