'use client';

/**
 * SceneCanvas: the single WebGL canvas behind the whole page.
 *
 * This module (and three.js, R3F, drei, postprocessing and GSAP with it) is
 * loaded lazily by Portfolio with `next/dynamic({ ssr: false })`, and only
 * once the browser is idle. The HTML content therefore paints, becomes
 * interactive and is crawlable before any 3D code is downloaded, which is
 * what keeps Lighthouse performance high despite the scene.
 *
 * Composition (top to bottom of the "library shaft"):
 *   HeroScene (y = 0) → ProjectScene (-14) → AboutScene (-28) → ContactScene (-42)
 * with Particles following the camera, SceneLights shared by all, and
 * CameraRig moving the camera between them on scroll.
 */
import { Component, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import clsx from 'clsx';
import { useStore } from '@/lib/store';
import { CAMERA, QUALITY, QUALITY_ORDER, SECTIONS } from '@/lib/sceneConfig';
import { getForcedQuality } from '@/lib/utils';
import CameraRig from './CameraRig';
import HeroScene from './HeroScene';
import ProjectScene from './ProjectScene';
import AboutScene from './AboutScene';
import ContactScene from './ContactScene';
import Particles from './Particles';
import { Effects, SceneLights } from './Lights';
import { SceneControlsPanel } from './useSceneControls';
import styles from './SceneCanvas.module.css';

/**
 * If WebGL fails at runtime (lost context, driver bug), drop the canvas
 * silently: the page is fully usable without it and the CSS backdrop remains.
 */
class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const tint = new THREE.Color();

/**
 * Fades the background and fog colour toward the active chapter's tint, so
 * the room warms in "About" and cools to night blue in "Contact".
 */
function AtmosphereTint() {
  const scene = useThree((state) => state.scene);
  useFrame((_, delta) => {
    const { activeSection, reducedMotion } = useStore.getState();
    tint.set(SECTIONS[activeSection]?.tint ?? SECTIONS.prologue.tint);
    const k = reducedMotion ? 1 : 1 - Math.exp(-1.5 * Math.min(delta, 0.1));
    scene.background?.lerp(tint, k);
    scene.fog?.color.lerp(tint, k);
  });
  return null;
}

/** Flags the store once the first frame is on screen (drives the fade-in). */
function FirstFrame() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    useStore.getState().setSceneReady(true);
  });
  return null;
}

export default function SceneCanvas() {
  const qualityKey = useStore((state) => state.quality);
  const reducedMotion = useStore((state) => state.reducedMotion);
  const sceneReady = useStore((state) => state.sceneReady);
  const quality = QUALITY[qualityKey];

  // Mutable values GSAP animates and the scene reads every frame. Passed by
  // reference, so animating them never re-renders React.
  const runtime = useMemo(
    () => ({ light: reducedMotion ? 1 : 0, dolly: reducedMotion ? 0 : CAMERA.introDolly }),
    // Created once on purpose; CameraRig resets it if reduced motion toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // The god-ray pass needs the actual window mesh, so it is captured with a
  // callback ref into state (a plain ref would not trigger the re-render).
  const [sun, setSun] = useState(null);

  /** Step down one quality tier when drei measures a sustained FPS drop. */
  const handleDecline = useCallback(() => {
    if (getForcedQuality()) return;
    const { quality: current, setQuality } = useStore.getState();
    const index = QUALITY_ORDER.indexOf(current);
    if (index > 0) setQuality(QUALITY_ORDER[index - 1]);
  }, []);

  return (
    <div className={clsx(styles.root, sceneReady && styles.visible)} aria-hidden="true">
      <SceneErrorBoundary>
        <Canvas
          dpr={quality.dpr}
          shadows={quality.shadows}
          frameloop={reducedMotion ? 'demand' : 'always'}
          camera={{
            fov: CAMERA.fov,
            near: CAMERA.near,
            far: CAMERA.far,
            position: [0, 0, SECTIONS.prologue.camera.position[2] + runtime.dolly],
          }}
          gl={{
            // The composer does its own multisampling; native AA only matters without it.
            antialias: !quality.postprocessing,
            powerPreference: 'high-performance',
            stencil: false,
          }}
        >
          <color attach="background" args={[SECTIONS.prologue.tint]} />
          <fogExp2 attach="fog" args={[SECTIONS.prologue.tint, 0.045]} />

          <PerformanceMonitor onDecline={handleDecline} flipflops={3} />
          <CameraRig runtime={runtime} />
          <AtmosphereTint />
          <SceneLights quality={quality} runtime={runtime} />

          <Suspense fallback={null}>
            <HeroScene quality={quality} onSun={setSun} />
            <ProjectScene quality={quality} />
            <AboutScene quality={quality} runtime={runtime} />
            <ContactScene quality={quality} />
            <Particles count={quality.particles} pages={quality.pages} />
          </Suspense>

          {quality.postprocessing && <Effects quality={quality} sun={sun} />}
          <FirstFrame />
        </Canvas>
      </SceneErrorBoundary>
      <SceneControlsPanel />
    </div>
  );
}
