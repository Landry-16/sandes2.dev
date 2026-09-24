/**
 * utils.js: small, pure helpers shared by the DOM and the 3D scene.
 */

/** Clamp `value` into [min, max]. */
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Linear interpolation from a to b by t. */
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Frame-rate independent smoothing. `lerp(a, b, 0.1)` every frame moves
 * twice as fast at 120 Hz as at 60 Hz; `damp` does not, because the blend
 * factor is derived from the real elapsed time `dt`.
 * @param {number} lambda  higher = snappier
 */
export const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));

/** Hermite smoothstep: 0 at edge0, 1 at edge1, smooth in between. */
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Deterministic pseudo-random generator (mulberry32). Scenes use it instead
 * of Math.random so the layout is identical on every visit and every render.
 * @param {number} seed
 * @returns {() => number} function returning floats in [0, 1)
 */
export function createRandom(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ROMAN = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

/** 4 → "IV". Used for folio numbers and chapter marks. */
export function toRoman(num) {
  let n = Math.floor(num);
  let out = '';
  for (const [value, glyph] of ROMAN) {
    while (n >= value) {
      out += glyph;
      n -= value;
    }
  }
  return out;
}

/** True when the user asked the OS for less motion. Safe on the server. */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when a WebGL context can be created. */
export function hasWebGL() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2')) ||
      Boolean(window.WebGLRenderingContext && canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

const TIERS = ['high', 'medium', 'low'];

/**
 * A tier forced from the URL, e.g. `/?quality=high`. Handy for checking the
 * full scene on a weak machine, or the low tier on a strong one. When set,
 * the runtime auto-downgrade is disabled too.
 * @returns {'high' | 'medium' | 'low' | null}
 */
export function getForcedQuality() {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('quality');
  return TIERS.includes(value) ? value : null;
}

/**
 * Pick a starting quality tier from what we can know up front. The canvas
 * refines this at runtime with drei's <PerformanceMonitor>.
 * @returns {'high' | 'medium' | 'low'}
 */
export function detectQuality() {
  if (typeof window === 'undefined') return 'high';
  const forced = getForcedQuality();
  if (forced) return forced;
  const width = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 8; // Chrome-only; assume capable elsewhere
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;

  if (width < 720 || cores <= 2 || memory <= 2) return 'low';
  if (width < 1100 || coarse || cores <= 4 || memory <= 4) return 'medium';
  return 'high';
}
