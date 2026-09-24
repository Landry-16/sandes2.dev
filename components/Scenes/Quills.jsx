'use client';

/**
 * Quills: a few feather quills gliding along slow looping paths.
 *
 * They are deliberately choreographed *against* the books so the scene never
 * moves as one block:
 *   - each follows its own Lissajous (figure-of-eight) path and turns to
 *     face the way it is travelling, nib first;
 *   - they wobble around their long axis instead of tumbling;
 *   - on scroll they *sink* while the books rise, and scroll speed makes
 *     them spin around the shaft like a quill rolled between fingers.
 *
 * There are only a handful of quills, so plain meshes are used (not
 * instancing). Geometry and materials are shared between all of them.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import { PALETTE } from '@/lib/sceneConfig';
import { damp } from '@/lib/utils';

let cached = null;

/**
 * Build the shared quill parts, laid out along +x with the nib at -x.
 * @returns {{ vane, shaft, nib, vaneMaterial, shaftMaterial, nibMaterial }}
 */
function getQuillParts() {
  if (cached) return cached;

  // Feather vane: an asymmetric leaf shape, wider on one side like a real quill.
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.8, 0.34, 2.05, 0.1);
  shape.quadraticCurveTo(2.25, 0.04, 2.3, 0);
  shape.quadraticCurveTo(1.1, -0.2, 0, 0);
  const vane = new THREE.ShapeGeometry(shape, 16);
  vane.translate(0.25, 0, 0);

  const shaft = new THREE.CylinderGeometry(0.012, 0.022, 2.9, 6);
  shaft.rotateZ(Math.PI / 2);
  shaft.translate(1.15, 0, 0);

  const nib = new THREE.ConeGeometry(0.028, 0.24, 8);
  nib.rotateZ(Math.PI / 2); // point toward -x
  nib.translate(-0.42, 0, 0);

  cached = {
    vane,
    shaft,
    nib,
    vaneMaterial: new THREE.MeshStandardMaterial({
      color: PALETTE.lightSoft,
      roughness: 0.55,
      side: THREE.DoubleSide,
      emissive: PALETTE.lightSoft,
      emissiveIntensity: 0.06,
      transparent: true,
      opacity: 0.92,
    }),
    shaftMaterial: new THREE.MeshStandardMaterial({ color: PALETTE.accentSecondary, roughness: 0.5 }),
    nibMaterial: new THREE.MeshStandardMaterial({
      color: PALETTE.goldAccent,
      metalness: 0.9,
      roughness: 0.25,
      emissive: PALETTE.goldPrimary,
      emissiveIntensity: 0.25,
    }),
  };
  return cached;
}

/**
 * @param {object}   props
 * @param {object[]} props.quills  path definitions (see HERO_QUILLS)
 * @param {number[]} [props.anchor] world position of the chapter scene
 */
export default function Quills({ quills, anchor = [0, 0, 0] }) {
  const parts = getQuillParts();
  const outerRefs = useRef([]);
  const innerRefs = useRef([]);
  // Smoothed values carried across frames (no React state → no re-renders).
  const motion = useRef({ velocity: 0, spin: 0, pitch: 0 });

  // Random-looking but stable per-quill offsets.
  const offsets = useMemo(() => quills.map((_, i) => 0.6 + i * 1.37), [quills]);

  useFrame((frame, delta) => {
    const { scroll, pointer, reducedMotion } = useStore.getState();
    const dt = Math.min(delta, 0.1);
    const m = motion.current;
    const elapsed = reducedMotion ? 0 : frame.clock.elapsedTime;

    // Scroll velocity (px/frame) → a damped spin impulse.
    m.velocity = damp(m.velocity, reducedMotion ? 0 : scroll.velocity, 4, dt);
    m.spin += m.velocity * 0.004;
    m.pitch = damp(m.pitch, pointer.active && !reducedMotion ? pointer.y * 0.2 : 0, 2, dt);

    const travelled = reducedMotion ? 0 : anchor[1] - frame.camera.position.y;

    quills.forEach((q, i) => {
      const outer = outerRefs.current[i];
      const inner = innerRefs.current[i];
      if (!outer || !inner) return;

      const t = elapsed * q.speed + q.phase;
      const [cx, cy, cz] = q.center;
      const [rx, ry, rz] = q.radius;

      // Figure-of-eight: x/z trace an ellipse while y oscillates twice as fast.
      outer.position.set(
        anchor[0] + cx + Math.sin(t) * rx,
        anchor[1] + cy + Math.sin(t * 2 + offsets[i]) * ry - travelled * 0.25 * (q.sink ?? 1),
        anchor[2] + cz + Math.cos(t) * rz,
      );

      // Face the direction of travel (derivative of the path), nib first.
      const dx = Math.cos(t) * rx;
      const dz = -Math.sin(t) * rz;
      outer.rotation.set(0, Math.atan2(dz, -dx), -0.35 + Math.sin(t * 1.3 + offsets[i]) * 0.18 + m.pitch);

      // Wobble and scroll-driven roll around the quill's own shaft.
      inner.rotation.x = Math.sin(elapsed * 0.9 + offsets[i]) * 0.35 + m.spin;
    });
  });

  return (
    <group>
      {quills.map((q, i) => (
        <group key={i} ref={(el) => (outerRefs.current[i] = el)} scale={q.scale}>
          <group ref={(el) => (innerRefs.current[i] = el)}>
            <mesh geometry={parts.vane} material={parts.vaneMaterial} />
            <mesh geometry={parts.shaft} material={parts.shaftMaterial} />
            <mesh geometry={parts.nib} material={parts.nibMaterial} />
          </group>
        </group>
      ))}
    </group>
  );
}
