'use client';

/**
 * useScrollPosition.js: the site's single scroll listener, plus the
 * "which chapter am I in" observer.
 *
 * Why a tracker instead of `useScroll()` in every component?
 * Each component attaching its own listener multiplies work per scroll
 * event, and storing the value in React state re-renders on every tick.
 * Here one passive listener writes into the Zustand store at most once per
 * animation frame; the 3D scene reads it with getState() (no re-render) and
 * DOM components subscribe only to the discrete values they need.
 */
import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/**
 * Install the global scroll tracker. Mount exactly once (Portfolio does).
 * Writes `{ y, progress, velocity, vh }` to `useStore().scroll`.
 */
export function useScrollTracker() {
  useEffect(() => {
    const { setScroll } = useStore.getState();
    let frame = 0;
    let lastY = window.scrollY;

    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const velocity = y - lastY; // px per frame; consumers damp it themselves
      lastY = y;
      setScroll({ y, progress: y / max, velocity, vh: y / window.innerHeight });
      // Keep sampling until the page settles so velocity decays back to 0.
      if (velocity !== 0) frame = requestAnimationFrame(measure);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}

/**
 * Track which section crosses the middle band of the viewport and publish
 * its id as `activeSection`. IntersectionObserver is used instead of
 * comparing offsets on every scroll, so this costs nothing while idle.
 * @param {string[]} ids  DOM ids of the sections, in page order
 */
export function useActiveSectionTracker(ids) {
  const key = ids.join('|');

  useEffect(() => {
    const { setActiveSection } = useStore.getState();
    const elements = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      // A thin horizontal band across the middle of the screen.
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);
}
