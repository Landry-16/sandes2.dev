/**
 * sceneConfig.js: every tunable number of the 3D scene, in one place.
 *
 * How the world is laid out
 * ─────────────────────────
 * There is ONE WebGL canvas, fixed behind the page. The 3D world is a tall
 * vertical "library shaft": each chapter of the page has its own little scene
 * stacked below the previous one (prologue at y = 0, projects at y = -14, …).
 * As you scroll, a GSAP timeline moves the camera down the shaft, so every
 * section gets its own backdrop while sharing a single renderer, far cheaper
 * than one canvas per section.
 *
 * Units are three.js world units (roughly "one book is one unit wide").
 */

/** Palette mirrored from app/styles/palette.css, WebGL cannot read CSS vars. */
export const PALETTE = {
  bgPrimary: '#0f0f0f',
  bgSecondary: '#1a1a2e',
  bgAccent: '#2b1f1f',
  textPrimary: '#e8dcc8',
  textSecondary: '#a89968',
  goldPrimary: '#c9a86b',
  goldAccent: '#e8c547',
  lightCandle: '#ffd89b',
  lightSoft: '#f4e4c1',
  accentPrimary: '#cf6a43',
  accentSecondary: '#8b6f47',
};

/** Leather bindings. Lifted a little from the palette so they read under candlelight. */
export const LEATHER = ['#5a3a22', '#6b2f3a', '#3d2817', PALETTE.accentSecondary, '#34402c', '#4a2a2a'];

/** Vertical distance between two chapter scenes. */
export const SECTION_GAP = 14;

/**
 * Per-chapter scene anchors. Keys match the section ids in lib/content.js.
 * - `y`       world-space height of the chapter's scene
 * - `camera`  where the camera sits / looks while that chapter fills the screen
 * - `tint`    background + fog colour the scene fades to (palette-derived)
 */
export const SECTIONS = {
  prologue: {
    y: 0,
    camera: { position: [0, 0, 9], target: [0, 0, 0] },
    tint: '#110f18',
  },
  projects: {
    y: -SECTION_GAP,
    camera: { position: [0, -SECTION_GAP, 11], target: [0, -SECTION_GAP - 0.5, -2] },
    tint: PALETTE.bgPrimary,
  },
  about: {
    y: -SECTION_GAP * 2,
    camera: { position: [-0.6, -SECTION_GAP * 2 + 0.4, 8.5], target: [1.4, -SECTION_GAP * 2 - 0.2, 0] },
    tint: '#1b1414',
  },
  contact: {
    y: -SECTION_GAP * 3,
    camera: { position: [0, -SECTION_GAP * 3, 10], target: [0.6, -SECTION_GAP * 3, 0] },
    tint: '#14142a',
  },
};

export const SECTION_ORDER = ['prologue', 'projects', 'about', 'contact'];

/** Camera lens. A narrow-ish FOV flattens perspective, like a painted scene. */
export const CAMERA = {
  fov: 38,
  near: 0.1,
  far: 60,
  /** How far the camera sways with the mouse (world units). */
  mouseSway: 0.35,
  /** Damping speed for camera follow (higher = snappier). */
  damping: 3.2,
  /** Extra distance the camera starts back during the intro dolly. */
  introDolly: 3,
};

/**
 * Quality tiers. Picked from viewport + hardware in lib/utils.js and
 * downgraded at runtime by drei's <PerformanceMonitor> if FPS drops.
 */
export const QUALITY = {
  high: {
    dpr: [1, 2],
    particles: 520,
    pages: 36,
    heroBooks: 7,
    projectBooks: 6,
    postprocessing: true,
    godRays: true,
    shadows: true,
    multisampling: 4,
    mouseTilt: true,
    candleLights: 4,
  },
  medium: {
    dpr: [1, 1.5],
    particles: 400,
    pages: 20,
    heroBooks: 6,
    projectBooks: 5,
    postprocessing: true,
    godRays: false,
    shadows: false,
    multisampling: 0,
    mouseTilt: true,
    candleLights: 3,
  },
  low: {
    dpr: [1, 1.25],
    particles: 150,
    pages: 8,
    heroBooks: 3,
    projectBooks: 3,
    postprocessing: false,
    godRays: false,
    shadows: false,
    multisampling: 0,
    mouseTilt: false,
    candleLights: 2,
  },
};

export const QUALITY_ORDER = ['low', 'medium', 'high'];

/**
 * Motion presets for <FloatingBooks>. Each can be live-tuned with Leva in
 * development (see components/Scenes/useSceneControls.js).
 */
export const BOOK_MOTION = {
  drift: {
    rotationSpeed: 0.18, // radians / second, scaled per book
    bobAmplitude: 0.28,  // world units
    bobSpeed: 0.55,
    maxTilt: 0.35,       // radians, the cap on "look at the cursor"
    tiltDamping: 2.5,
    scrollLift: 0.35,    // extra rise per world unit the camera travels past the scene
    breathe: 0,
  },
  orbit: {
    rotationSpeed: 0.08,
    bobAmplitude: 0.18,
    bobSpeed: 0.35,
    maxTilt: 0.2,
    tiltDamping: 2,
    scrollLift: 0.12,
    breathe: 0,
    orbitSpeed: 0.06,
    hoverBoost: 2.5,     // orbit speed multiplier while a project card is hovered
  },
  calm: {
    rotationSpeed: 0.03,
    bobAmplitude: 0.08,
    bobSpeed: 0.25,
    maxTilt: 0.12,
    tiltDamping: 1.2,
    scrollLift: 0.05,
    breathe: 0.012,      // slow scale "breathing" for the closing scene
  },
};

/**
 * Hero books. `position` is relative to the prologue anchor. `parallax`
 * scales how fast each book rises when scrolling, different values create
 * depth. `spin` scales rotation speed per axis so no two books move alike.
 */
export const HERO_BOOKS = [
  { position: [-4.6, 1.6, -1.2], rotation: [0.3, 0.6, -0.3], scale: 1.05, parallax: 1.2, spin: [0.6, 1.0, 0.4] },
  { position: [4.4, 1.9, -1.8], rotation: [-0.2, -0.7, 0.25], scale: 1.25, parallax: 0.8, spin: [0.4, 0.7, 0.8] },
  { position: [3.3, -1.9, -0.6], rotation: [0.5, 0.2, -0.6], scale: 0.8, parallax: 1.4, spin: [1.0, 0.5, 0.3] },
  { position: [-3.4, -2.2, -0.9], rotation: [-0.4, 0.9, 0.5], scale: 0.9, parallax: 1.0, spin: [0.3, 0.9, 0.6] },
  { position: [5.8, -0.4, -4.2], rotation: [0.1, -0.2, 0.1], scale: 0.7, parallax: 0.6, spin: [0.8, 0.3, 0.9] },
  { position: [-6.0, -0.2, -3.8], rotation: [0.7, 0.3, 0.8], scale: 0.6, parallax: 0.7, spin: [0.5, 0.6, 0.2] },
  { position: [-1.4, 2.9, -5.0], rotation: [0.2, 0.4, -0.9], scale: 0.65, parallax: 0.5, spin: [0.2, 0.4, 1.0] },
];

/** Compact hero layout for portrait screens: books above and below the title. */
export const HERO_BOOKS_PORTRAIT = [
  { position: [-1.1, 2.7, -1.0], rotation: [0.3, 0.6, -0.3], scale: 0.7, parallax: 1.2, spin: [0.6, 1.0, 0.4] },
  { position: [1.3, 2.3, -2.2], rotation: [-0.2, -0.7, 0.25], scale: 0.8, parallax: 0.8, spin: [0.4, 0.7, 0.8] },
  { position: [0.9, -2.7, -0.8], rotation: [0.5, 0.2, -0.6], scale: 0.65, parallax: 1.4, spin: [1.0, 0.5, 0.3] },
];

/** Books orbiting behind the project grid. Angle in radians around the ring. */
export const PROJECT_BOOKS = [
  { angle: 0.0, radius: 7.0, height: 1.8, scale: 1.1 },
  { angle: 1.05, radius: 6.2, height: -1.6, scale: 0.9 },
  { angle: 2.1, radius: 7.4, height: 0.4, scale: 1.2 },
  { angle: 3.15, radius: 6.6, height: 2.4, scale: 0.8 },
  { angle: 4.2, radius: 7.2, height: -2.2, scale: 1.0 },
  { angle: 5.25, radius: 6.4, height: -0.3, scale: 0.85 },
];

/** Quills: a Lissajous path each, deliberately out of phase with the books. */
export const HERO_QUILLS = [
  { center: [2.2, 1.4, -0.5], radius: [1.2, 0.5, 0.6], speed: 0.16, phase: 0, scale: 0.9, sink: 1.1 },
  { center: [-2.4, -1.0, -1.5], radius: [1.0, 0.7, 0.8], speed: 0.12, phase: 2.1, scale: 0.75, sink: 0.7 },
  { center: [4.8, -1.6, -2.5], radius: [0.6, 0.9, 0.4], speed: 0.2, phase: 4.2, scale: 0.6, sink: 1.4 },
];

export const PARTICLES = {
  /**
   * Particles live in a band of this height centred on the camera. They are
   * world-space (so they parallax as you scroll), but anything leaving the
   * band is recycled to the other side, keeping density constant everywhere.
   */
  band: 14,
  width: 18,
  depth: [-8, 1],
  driftSpeed: 0.22,       // world units / second, upward
  wobble: 0.35,
  cursorRadius: 2.6,
  cursorSpeedBoost: 3.5,  // speed multiplier at the cursor's centre
  cursorScaleBoost: 1.8,
  cursorPull: 0.6,        // how strongly motes gather toward the cursor
  /** Mix of particle kinds (must sum to 1). Loose pages are a separate mesh. */
  mix: { dust: 0.72, ink: 0.28 },
};

/** Candle point lights, positioned per chapter (relative to its anchor). */
export const CANDLES = [
  { section: 'prologue', position: [-2.8, -2.4, 2.5], intensity: 70, distance: 18 },
  { section: 'prologue', position: [3.6, 1.2, 1.5], intensity: 45, distance: 15 },
  { section: 'projects', position: [0, 1.5, 2], intensity: 55, distance: 18 },
  { section: 'contact', position: [-1.5, 1, 3], intensity: 30, distance: 16 },
];

/** The "high window" whose light produces the god rays in the prologue. */
export const WINDOW_LIGHT = {
  position: [6.5, 6.2, -16],
  radius: 0.6,
};

export const EFFECTS = {
  bloom: { intensity: 0.85, threshold: 0.55, smoothing: 0.3, radius: 0.72 },
  godRays: { samples: 48, density: 0.92, decay: 0.93, weight: 0.35, exposure: 0.42, clampMax: 1 },
  vignette: { offset: 0.28, darkness: 0.72 },
  noise: 0.035,
};
