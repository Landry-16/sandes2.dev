'use client';

/**
 * ProjectsSection: chapter II, "The Reading Room".
 *
 * Shows at most `projectsGrid.limit` projects for the selected filter
 * (All / Academic / Personal). Everything else lives on the bookshelf page,
 * reached through the "See all" link. The filter buttons use aria-pressed,
 * and a polite live region announces how many projects are shown.
 *
 * A client component because of the filter state; its HTML is still fully
 * server-rendered.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';
import { projects, projectsGrid, sections } from '@/lib/content';
import ProjectCard from '@/components/Common/ProjectCard';
import SectionTitle from '@/components/Common/SectionTitle';
import Reveal from '@/components/Common/Reveal';
import styles from './ProjectsSection.module.css';

const chapter = sections.find((section) => section.id === 'projects');

export default function ProjectsSection() {
  const [filter, setFilter] = useState('all');

  const visible = useMemo(
    () =>
      projects
        .map((project, index) => ({ project, index }))
        .filter(({ project }) => filter === 'all' || project.category === filter)
        .slice(0, projectsGrid.limit),
    [filter],
  );

  return (
    <section id="projects" className={styles.section} aria-labelledby="projects-title">
      <div className={styles.inner}>
        <SectionTitle id="projects-title" eyebrow={`Chapter ${chapter.numeral}`} title={chapter.title} />

        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label="Filter projects">
            {projectsGrid.filters.map((option) => (
              <button
                key={option.value}
                type="button"
                className={clsx('label', styles.filter, filter === option.value && styles.active)}
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Link className={`label ${styles.seeAll}`} href={projectsGrid.seeAll.href}>
            {projectsGrid.seeAll.label}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <p className="visually-hidden" aria-live="polite">
          {visible.length} {visible.length === 1 ? 'project' : 'projects'} shown
        </p>

        <ul role="list" className={styles.grid}>
          {visible.map(({ project, index }, i) => (
            <Reveal as="li" key={project.slug} delay={i * 0.08} className={styles.item}>
              <ProjectCard project={project} index={index} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
