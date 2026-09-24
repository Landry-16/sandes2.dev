'use client';

/**
 * useMouse.js: the site's single pointer listener.
 *
 * Writes the cursor position, normalised to [-1, 1] on both axes with +y up
 * (the same convention three.js uses for NDC), into `useStore().pointer`.
 * Updates are batched to one per animation frame. Touch input is ignored on
 * purpose: a tap would teleport the "cursor" and jolt the scene.
 */
import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/** Install the global pointer tracker. Mount exactly once (Portfolio does). */
export function useMouseTracker() {
  useEffect(() => {
    const { setPointer } = useStore.getState();
    let frame = 0;
    let clientX = 0;
    let clientY = 0;

    const flush = () => {
      frame = 0;
      setPointer({
        x: (clientX / window.innerWidth) * 2 - 1,
        y: -((clientY / window.innerHeight) * 2 - 1),
        active: true,
      });
    };

    const onMove = (event) => {
      if (event.pointerType === 'touch') return;
      clientX = event.clientX;
      clientY = event.clientY;
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const onLeave = () => {
      const { pointer } = useStore.getState();
      setPointer({ ...pointer, active: false });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}
