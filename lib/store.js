/**
 * store.js: the one piece of shared state between the DOM and the 3D scene.
 *
 * Two kinds of values live here:
 *
 * 1. **Continuous signals** (`scroll`, `pointer`) that change every frame.
 *    They are written by a *single* listener each (see lib/hooks) and read by
 *    the 3D scene with `useStore.getState()` inside `useFrame`. Reading via
 *    getState() never subscribes, so a mouse move does not re-render React.
 *
 * 2. **Discrete state** (`activeSection`, `hoveredProject`, `quality`, …) that
 *    changes rarely. DOM components subscribe with a selector (e.g.
 *    `useStore((s) => s.activeSection)`) and only re-render when that exact
 *    value changes.
 */
import { create } from 'zustand';

export const useStore = create((set) => ({
  /** Scroll position. `vh` = viewports scrolled, handy for parallax maths. */
  scroll: { y: 0, progress: 0, velocity: 0, vh: 0 },
  /** Pointer in normalised device coords: x, y ∈ [-1, 1], y up. */
  pointer: { x: 0, y: 0, active: false },
  /** Id of the chapter currently crossing the middle of the viewport. */
  activeSection: 'prologue',
  /** Index of the project card being hovered/focused, or null. */
  hoveredProject: null,
  /** 'high' | 'medium' | 'low', see QUALITY in lib/sceneConfig.js. */
  quality: 'high',
  /** Mirrors `prefers-reduced-motion: reduce`. */
  reducedMotion: false,
  /** True once the canvas has rendered its first frame (drives the fade-in). */
  sceneReady: false,

  setScroll: (scroll) => set({ scroll }),
  setPointer: (pointer) => set({ pointer }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setHoveredProject: (hoveredProject) => set({ hoveredProject }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
}));
