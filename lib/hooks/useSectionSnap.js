'use client';

/**
 * useSectionSnap.js: gentle "resistance" between chapters.
 *
 * Native CSS scroll snap either pulls small scrolls back to where they
 * started or locks the reader in, so this is a small direction-aware
 * version instead. When a scroll gesture ends (the `scrollend` event, or a
 * short pause in browsers without it):
 *
 *   1. if the gesture crossed the start of a chapter, the page glides back
 *      to that chapter, so a fast flick stops at each chapter in turn;
 *   2. otherwise, if it ended just short of the next chapter in the
 *      direction of travel, the page glides onto it.
 *
 * Scrolling inside a chapter, or leaving one, is never pulled back, so
 * long chapters (the projects grid on a phone) read normally. Chapter
 * starts match the nav links: the section top minus the fixed nav height.
 * With reduced motion the glide is an instant jump.
 */
import { useEffect } from 'react';

/** Share of the viewport, before a chapter start, that counts as "just short". */
const CATCH_ZONE = 0.28;
/** Pause that ends a gesture where `scrollend` is unsupported (ms). */
const IDLE_MS = 140;

/**
 * @param {string[]} ids  DOM ids of the chapters, in page order
 */
export function useSectionSnap(ids) {
  const key = ids.join('|');

  useEffect(() => {
    const sections = key.split('|').map((id) => document.getElementById(id)).filter(Boolean);
    if (sections.length < 2) return undefined;

    const supportsScrollEnd = 'onscrollend' in window;
    let gestureStart = window.scrollY;
    let inGesture = false;
    let gliding = false;
    let pointerDown = false;
    let idleTimer = 0;

    /** Scroll positions where each chapter starts, clamped to the page. */
    const stops = () => {
      const nav = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return sections.map((el) =>
        Math.min(max, Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - nav))),
      );
    };

    const glideTo = (top) => {
      if (Math.abs(top - window.scrollY) < 2) return;
      gliding = true;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top, behavior: reduce ? 'instant' : 'smooth' });
    };

    const onGestureEnd = () => {
      if (gliding) {
        // Our own glide just finished: start fresh from here.
        gliding = false;
        inGesture = false;
        gestureStart = window.scrollY;
        return;
      }
      if (!inGesture || pointerDown) return;
      inGesture = false;

      const start = gestureStart;
      const end = window.scrollY;
      gestureStart = end;
      if (Math.abs(end - start) < 2) return;

      const down = end > start;
      const points = stops();
      const catchZone = window.innerHeight * CATCH_ZONE;

      // 1. Crossed a chapter start: stop at the first one crossed.
      const crossed = down
        ? points.find((p) => p > start + 1 && p < end - 1)
        : [...points].reverse().find((p) => p < start - 1 && p > end + 1);
      if (crossed !== undefined) {
        glideTo(crossed);
        return;
      }

      // 2. Ended just short of the next chapter start: settle onto it.
      const ahead = down ? points.find((p) => p > end) : [...points].reverse().find((p) => p < end);
      if (ahead !== undefined && Math.abs(ahead - end) <= catchZone) glideTo(ahead);
    };

    const onScroll = () => {
      if (!inGesture && !gliding) {
        inGesture = true;
      }
      if (!supportsScrollEnd) {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(onGestureEnd, IDLE_MS);
      }
    };

    // Clicks on nav links and other anchors land exactly; don't fight them.
    const onClick = (event) => {
      if (event.target.closest?.('a[href^="#"]')) gliding = true;
    };
    // A finger still on the screen means the gesture is not over.
    const onPointerDown = (event) => {
      if (event.pointerType === 'touch') pointerDown = true;
    };
    const onPointerUp = () => {
      pointerDown = false;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    if (supportsScrollEnd) window.addEventListener('scrollend', onGestureEnd);
    document.addEventListener('click', onClick);
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', onGestureEnd);
      document.removeEventListener('click', onClick);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [key]);
}
