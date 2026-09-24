'use client';

/**
 * Lights.jsx: everything that makes the scriptorium glow.
 *
 * Exports:
 *   - <SceneLights>  ambient fill, flickering candle point lights, and (high
 *                    tier only) one shadow-casting "window" spotlight.
 *   - <Candle>       a visible candle: wax, an HDR flame the bloom picks up,
 *                    and its own flickering point light.
 *   - <WindowSun>    the bright disc of a high window; the god-ray pass uses
 *                    it as its light source.
 *   - <Effects>      the post-processing stack (bloom, god rays, tone mapping,
 *                    vignette, film grain), scaled down per quality tier.
 *
 * Why only one shadow caster: a point light renders its shadow map six times
 * (once per cube face) every frame. A single spotlight costs one pass and is
 * enough to make the books shade one another.
 */
import { forwardRef, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, GodRays, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import { CANDLES, EFFECTS, PALETTE, SECTIONS, WINDOW_LIGHT } from '@/lib/sceneConfig';
import { damp } from '@/lib/utils';
import { useSceneControls } from './useSceneControls';

/**
 * Candle flicker: a sum of sines at unrelated frequencies. Cheap, smooth,
 * and never visibly periodic, unlike Math.random(), which strobes.
 */
export function flicker(t, seed = 0) {
  return 0.86 + Math.sin(t * 7.3 + seed) * 0.07 + Math.sin(t * 12.9 + seed * 2.1) * 0.045 + Math.sin(t * 3.1 + seed * 0.7) * 0.03;
}

/* ── Scene lights ─────────────────────────────────────────────────────── */

/**
 * @param {object} props
 * @param {object} props.quality  entry from QUALITY
 * @param {{ light: number }} props.runtime  shared mutable intro values (0 → 1 as the candles are "lit")
 */
export function SceneLights({ quality, runtime }) {
  const lightRefs = useRef([]);
  const hoverGain = useRef(1);
  const candles = useMemo(() => CANDLES.slice(0, quality.candleLights), [quality.candleLights]);
  const { ambient, candleGain } = useSceneControls('Lights', {
    ambient: { value: 0.6, min: 0, max: 2 },
    candleGain: { value: 1, min: 0, max: 3 },
  });

  useFrame((frame, delta) => {
    const { reducedMotion, hoveredProject } = useStore.getState();
    const t = reducedMotion ? 0 : frame.clock.elapsedTime;
    // Hovering a project card brightens the reading-room candle.
    hoverGain.current = damp(hoverGain.current, hoveredProject !== null ? 1.6 : 1, 3, Math.min(delta, 0.1));

    candles.forEach((candle, i) => {
      const light = lightRefs.current[i];
      if (!light) return;
      const gain = candle.section === 'projects' ? hoverGain.current : 1;
      light.intensity = candle.intensity * candleGain * runtime.light * gain * flicker(t, i * 1.9);
    });
  });

  return (
    <>
      <ambientLight intensity={ambient} color="#3b3040" />
      <hemisphereLight args={[PALETTE.textSecondary, PALETTE.bgAccent, 0.9]} />

      {candles.map((candle, i) => {
        const y = SECTIONS[candle.section].y;
        return (
          <pointLight
            key={i}
            ref={(el) => (lightRefs.current[i] = el)}
            position={[candle.position[0], y + candle.position[1], candle.position[2]]}
            color={PALETTE.lightCandle}
            intensity={0}
            distance={candle.distance}
            decay={2}
          />
        );
      })}

      {quality.shadows && (
        <spotLight
          position={[4, 8, 6]}
          angle={0.7}
          penumbra={1}
          intensity={60}
          distance={30}
          color={PALETTE.lightSoft}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-camera-near={1}
          shadow-camera-far={30}
        />
      )}
    </>
  );
}

/* ── Candle ───────────────────────────────────────────────────────────── */

/**
 * A lit candle. The flame colour is multiplied above 1.0 (HDR) so the bloom
 * pass makes it glow; `toneMapped={false}` stops it being clamped first.
 * @param {object} props
 * @param {number[]} [props.position]
 * @param {number}   [props.height]  wax height in world units
 * @param {number}   [props.intensity]
 * @param {{ light: number }} props.runtime
 */
export function Candle({ position = [0, 0, 0], height = 0.9, intensity = 30, runtime }) {
  const flame = useRef();
  const light = useRef();
  const flameColor = useMemo(() => new THREE.Color(PALETTE.lightCandle).multiplyScalar(4), []);

  useFrame((frame) => {
    const { reducedMotion } = useStore.getState();
    const t = reducedMotion ? 0 : frame.clock.elapsedTime;
    const f = flicker(t, 4.2);
    if (flame.current) {
      flame.current.scale.set(0.07 * (2 - f), 0.17 * f, 0.07 * (2 - f));
      flame.current.position.x = reducedMotion ? 0 : Math.sin(t * 2.7) * 0.012;
    }
    if (light.current) light.current.intensity = intensity * f * (runtime?.light ?? 1);
  });

  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.15, height, 20]} />
        <meshStandardMaterial color={PALETTE.lightSoft} roughness={0.6} emissive={PALETTE.lightCandle} emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0, height + 0.04, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
        <meshBasicMaterial color="#1a1208" />
      </mesh>
      <group position={[0, height + 0.2, 0]}>
        <mesh ref={flame}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color={flameColor} toneMapped={false} />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, height + 0.35, 0]} color={PALETTE.lightCandle} distance={9} decay={2} intensity={0} />
    </group>
  );
}

/* ── Window sun (god-ray source) ──────────────────────────────────────── */

/**
 * The glowing disc of a high window at the back of the prologue scene.
 * Bright enough to feed the god rays on the high tier; a faint distant moon
 * elsewhere (`dim`).
 */
export const WindowSun = forwardRef(function WindowSun({ dim = false, ...props }, ref) {
  return (
    <mesh ref={ref} position={WINDOW_LIGHT.position} {...props}>
      <circleGeometry args={[WINDOW_LIGHT.radius, 48]} />
      <meshBasicMaterial color={PALETTE.lightSoft} transparent opacity={dim ? 0.3 : 0.9} toneMapped={false} fog={false} />
    </mesh>
  );
});

/* ── Post-processing ──────────────────────────────────────────────────── */

/**
 * Bloom turns the HDR flames and dust into halos; god rays stream from the
 * window; ACES tone mapping maps the HDR result back to screen range; a
 * vignette and faint grain give the film-still, candlelit look.
 * @param {object} props
 * @param {object} props.quality   entry from QUALITY
 * @param {THREE.Mesh|null} props.sun  WindowSun mesh, once mounted
 */
export function Effects({ quality, sun }) {
  const post = useSceneControls('Post', {
    bloomIntensity: { value: EFFECTS.bloom.intensity, min: 0, max: 3 },
    bloomThreshold: { value: EFFECTS.bloom.threshold, min: 0, max: 1.5 },
    godRayWeight: { value: EFFECTS.godRays.weight, min: 0, max: 1 },
    godRayExposure: { value: EFFECTS.godRays.exposure, min: 0, max: 1 },
    vignette: { value: EFFECTS.vignette.darkness, min: 0, max: 1 },
    grain: { value: EFFECTS.noise, min: 0, max: 0.2 },
  });

  const withGodRays = quality.godRays && sun;

  return (
    <EffectComposer multisampling={quality.multisampling} disableNormalPass>
      <Bloom
        mipmapBlur
        intensity={post.bloomIntensity}
        luminanceThreshold={post.bloomThreshold}
        luminanceSmoothing={EFFECTS.bloom.smoothing}
        radius={EFFECTS.bloom.radius}
      />
      {withGodRays ? (
        <GodRays
          sun={sun}
          samples={EFFECTS.godRays.samples}
          density={EFFECTS.godRays.density}
          decay={EFFECTS.godRays.decay}
          weight={post.godRayWeight}
          exposure={post.godRayExposure}
          clampMax={EFFECTS.godRays.clampMax}
          kernelSize={KernelSize.SMALL}
          blur
        />
      ) : (
        <></>
      )}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={EFFECTS.vignette.offset} darkness={post.vignette} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={post.grain} />
    </EffectComposer>
  );
}
