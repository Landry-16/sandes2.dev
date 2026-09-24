'use client';

/**
 * Portfolio: the client-side shell around the page.
 *
 * Responsibilities, deliberately few:
 *   1. install the *single* scroll, pointer and active-section trackers that
 *      feed the Zustand store (everything else reads from the store);
 *   2. publish the environment: `prefers-reduced-motion` and the starting
 *      quality tier;
 *   3. lazy-load the WebGL scene only when it is wanted (see below);
 *   4. provide Framer Motion's lightweight `LazyMotion` bundle and make it
 *      honour the OS reduced-motion setting.
 *
 * The sections are passed in as `children` from app/page.jsx, so they stay
 * server components: their HTML is rendered on the server and shipped
 * without their JavaScript, which keeps the initial bundle lean.
 *
 * Deferring the canvas: three.js and the scene are ~250 kB gzipped. On
 * wide screens the chunk is preloaded when the browser goes idle after
 * `load`, so it is ready by the time it is needed. It is mounted on the
 * first pointer move, scroll, key or touch (and on wide screens, a few
 * seconds after `load` if the visitor does nothing). Mounting on real
 * activity keeps the render loop out of the page-load window. Phones skip
 * the preload and the timed mount to save bandwidth and battery; they get
 * the scene on their first scroll or touch. A CSS candle glow stands in
 * until then.
 */
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useActiveSectionTracker, useScrollTracker } from '@/lib/hooks/useScrollPosition';
import { useMouseTracker } from '@/lib/hooks/useMouse';
import { detectQuality, hasWebGL, prefersReducedMotion } from '@/lib/utils';
import { sections, site } from '@/lib/content';
import Navigation from './Navigation';
import styles from './Portfolio.module.css';

const loadScene = () => import('./Scenes/SceneCanvas');
const SceneCanvas = dynamic(loadScene, { ssr: false, loading: () => null });

const SECTION_IDS = sections.map((section) => section.id);
/** Delay after `load` before mounting the scene for a visitor who does nothing. */
const FALLBACK_DELAY_MS = 5000;

/** Keep `reducedMotion` and `quality` in the store in sync with the device. */
function useEnvironment() {
  const lastDetected = useRef(null);

  useEffect(() => {
    const { setReducedMotion, setQuality } = useStore.getState();
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(prefersReducedMotion());

    // Only react when the *detected* tier changes (e.g. crossing a
    // breakpoint), so a runtime downgrade from PerformanceMonitor sticks.
    const syncQuality = () => {
      const detected = detectQuality();
      if (detected !== lastDetected.current) {
        lastDetected.current = detected;
        setQuality(detected);
      }
    };

    let timer = 0;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(syncQuality, 200);
    };

    syncMotion();
    syncQuality();
    media.addEventListener('change', syncMotion);
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      clearTimeout(timer);
      media.removeEventListener('change', syncMotion);
      window.removeEventListener('resize', onResize);
    };
  }, []);
}

/** Returns true once the 3D scene should be mounted. */
function useDeferredScene() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const events = ['pointermove', 'pointerdown', 'scroll', 'keydown', 'touchstart'];
    let idleHandle = 0;
    let started = false;

    // Probing WebGL creates a GL context, which is slow on some machines, so
    // it only happens at mount time.
    const mount = () => {
      if (started) return;
      started = true;
      cleanup();
      if (hasWebGL()) setReady(true);
    };

    let fallback = 0;
    let preloadHandle = 0;
    const scheduleFallback = () => {
      // Wide screens only (see the file header).
      if (!window.matchMedia('(min-width: 720px)').matches) return;
      if (window.requestIdleCallback) {
        preloadHandle = window.requestIdleCallback(() => loadScene().catch(() => {}), { timeout: 3000 });
      }
      fallback = window.setTimeout(() => {
        idleHandle = window.requestIdleCallback
          ? window.requestIdleCallback(mount, { timeout: 1000 })
          : window.setTimeout(mount, 50);
      }, FALLBACK_DELAY_MS);
    };

    if (document.readyState === 'complete') scheduleFallback();
    else window.addEventListener('load', scheduleFallback, { once: true });
    events.forEach((name) => window.addEventListener(name, mount, { passive: true, once: true }));

    function cleanup() {
      window.clearTimeout(fallback);
      window.removeEventListener('load', scheduleFallback);
      events.forEach((name) => window.removeEventListener(name, mount));
    }

    return () => {
      cleanup();
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(idleHandle);
        window.cancelIdleCallback(preloadHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
    };
  }, []);

  return ready;
}

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function Portfolio({ children }) {
  useEnvironment();
  useScrollTracker();
  useMouseTracker();
  useActiveSectionTracker(SECTION_IDS);
  const showScene = useDeferredScene();

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Navigation />
        {showScene && <SceneCanvas />}

        <main id="main" className={styles.main}>
          {children}
        </main>

        <footer className={styles.footer}>
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <a href={site.repository} target="_blank" rel="noopener noreferrer">
            Source
          </a>
        </footer>
      </MotionConfig>
    </LazyMotion>
  );
}
