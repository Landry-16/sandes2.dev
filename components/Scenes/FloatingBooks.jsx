'use client';

/**
 * FloatingBooks: a set of leather-bound books drifting through the scene.
 *
 * Performance: every book is drawn with GPU instancing. Instead of N meshes
 * (N draw calls, N matrix updates in the scene graph), there are two
 * InstancedMeshes for *all* books:
 *   1. the leather binding (boards + spine), with a per-instance colour;
 *   2. the "details" (page block and gold tooling) as one geometry with two
 *      material groups (parchment, gold).
 * Both meshes share the same per-book matrix, written once per frame from a
 * single reusable Object3D. Seven books or seventy cost ~3 draw calls.
 *
 * Motion, all composable:
 *   - continuous rotation on all three axes (per-book speed multipliers);
 *   - organic bobbing: a sum of two sines at non-harmonic frequencies, so
 *     the loop never visibly repeats;
 *   - scroll: books rise as the camera travels past their scene (parallax);
 *   - mouse: the whole set tilts toward the cursor, capped at `maxTilt`.
 *
 * Three layouts share the component via `preset`:
 *   'drift' (hero), 'orbit' (projects ring), 'calm' (contact).
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useStore } from '@/lib/store';
import { BOOK_MOTION, LEATHER, PALETTE, QUALITY } from '@/lib/sceneConfig';
import { damp } from '@/lib/utils';
import { useSceneControls } from './useSceneControls';

/* ── Geometry ─────────────────────────────────────────────────────────── */

/** A box translated to (x, y, z). */
function box(w, h, d, x = 0, y = 0, z = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

let cachedGeometry = null;

/**
 * Build (once) and return the shared book geometry. A book is 1 × 1.4 × 0.25
 * units with its spine on the left (-x). Cached at module level so every
 * scene reuses the same GPU buffers.
 * @returns {{ leather: THREE.BufferGeometry, details: THREE.BufferGeometry }}
 */
export function getBookGeometry() {
  if (cachedGeometry) return cachedGeometry;

  const leather = mergeGeometries([
    box(1.0, 1.4, 0.04, 0, 0, 0.105), // front board
    box(1.0, 1.4, 0.04, 0, 0, -0.105), // back board
    box(0.06, 1.4, 0.25, -0.5, 0, 0), // spine
  ]);

  const pages = box(0.94, 1.34, 0.17, 0.02, 0, 0);
  const gold = mergeGeometries([
    // raised bands across the spine
    box(0.07, 0.035, 0.262, -0.5, 0.45, 0),
    box(0.07, 0.035, 0.262, -0.5, -0.45, 0),
    // tooled frame on the front board
    box(0.8, 0.014, 0.006, 0.02, 0.6, 0.127),
    box(0.8, 0.014, 0.006, 0.02, -0.6, 0.127),
    box(0.014, 1.2, 0.006, -0.38, 0, 0.127),
    box(0.014, 1.2, 0.006, 0.42, 0, 0.127),
  ]);
  // `true` → one material group per source geometry: [0] pages, [1] gold.
  const details = mergeGeometries([pages, gold], true);

  cachedGeometry = { leather, details };
  return cachedGeometry;
}

/** Shared materials for the non-leather parts: [parchment, gold]. */
let cachedDetailMaterials = null;
export function getBookDetailMaterials() {
  if (cachedDetailMaterials) return cachedDetailMaterials;
  cachedDetailMaterials = [
    new THREE.MeshStandardMaterial({ color: PALETTE.lightSoft, roughness: 0.92 }),
    new THREE.MeshStandardMaterial({
      color: PALETTE.goldPrimary,
      metalness: 0.85,
      roughness: 0.32,
      emissive: PALETTE.goldPrimary,
      emissiveIntensity: 0.12,
    }),
  ];
  return cachedDetailMaterials;
}

/* ── Component ────────────────────────────────────────────────────────── */

const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();

/**
 * @param {object}   props
 * @param {object[]} props.books   layout entries (see HERO_BOOKS / PROJECT_BOOKS)
 * @param {'drift'|'orbit'|'calm'} [props.preset]
 * @param {number[]} [props.anchor]  world position of the chapter scene
 * @param {number[]} [props.orbitCenter] centre of the ring, relative to anchor
 * @param {number}   [props.colorOffset] rotate through LEATHER so scenes differ
 * @param {boolean}  [props.shadows] cast/receive shadows (high tier only)
 */
export default function FloatingBooks({
  books,
  preset = 'drift',
  anchor = [0, 0, 0],
  orbitCenter = [0, 0, -4],
  colorOffset = 0,
  shadows = false,
}) {
  const leatherRef = useRef();
  const detailsRef = useRef();
  const { leather, details } = getBookGeometry();
  const detailMaterials = getBookDetailMaterials();
  const count = books.length;

  const motion = useSceneControls(`Books · ${preset}`, BOOK_MOTION[preset]);

  // Per-book random phases, fixed for the lifetime of the component.
  const phases = useMemo(
    () => books.map((_, i) => [i * 1.7 + 0.3, i * 2.3 + 1.1, i * 0.9 + 2.2, i * 3.1 + 0.7]),
    [books],
  );

  // Smoothed state that persists between frames without triggering renders.
  const state = useRef({ tiltX: 0, tiltY: 0, orbitAngle: 0, orbitSpeed: motion.orbitSpeed || 0 });

  // Paint each binding once; colours never change afterwards.
  useLayoutEffect(() => {
    const mesh = leatherRef.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      mesh.setColorAt(i, tmpColor.set(LEATHER[(i + colorOffset) % LEATHER.length]));
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, colorOffset]);

  useFrame((frame, delta) => {
    const leatherMesh = leatherRef.current;
    const detailsMesh = detailsRef.current;
    if (!leatherMesh || !detailsMesh) return;

    const { pointer, reducedMotion, hoveredProject, quality } = useStore.getState();
    const dt = Math.min(delta, 0.1); // avoid jumps after a background tab
    const t = reducedMotion ? 0 : frame.clock.elapsedTime;
    const s = state.current;

    // 1. Mouse tilt, shared by the set and damped so it eases in and out.
    const tiltEnabled = !reducedMotion && pointer.active && QUALITY[quality].mouseTilt;
    s.tiltX = damp(s.tiltX, tiltEnabled ? -pointer.y * motion.maxTilt : 0, motion.tiltDamping, dt);
    s.tiltY = damp(s.tiltY, tiltEnabled ? pointer.x * motion.maxTilt : 0, motion.tiltDamping, dt);

    // 2. Scroll: how far the camera has travelled below this scene's anchor.
    const travelled = reducedMotion ? 0 : anchor[1] - frame.camera.position.y;
    const lift = travelled * motion.scrollLift;

    // 3. Orbit (projects ring) speeds up while a project card is hovered.
    if (preset === 'orbit' && !reducedMotion) {
      const target = motion.orbitSpeed * (hoveredProject !== null ? motion.hoverBoost : 1);
      s.orbitSpeed = damp(s.orbitSpeed, target, 1.5, dt);
      s.orbitAngle += s.orbitSpeed * dt;
    }

    const bob = motion.bobAmplitude;
    const bobT = t * motion.bobSpeed;
    const rot = t * motion.rotationSpeed;

    for (let i = 0; i < count; i++) {
      const book = books[i];
      const [p1, p2, p3, p4] = phases[i];
      // Two incommensurate sines → organic, non-repeating float.
      const bobY = Math.sin(bobT + p1) * bob * 0.65 + Math.sin(bobT * 1.73 + p2) * bob * 0.35;
      const bobX = Math.sin(bobT * 0.61 + p3) * bob * 0.3;

      if (preset === 'orbit') {
        const angle = book.angle + s.orbitAngle;
        dummy.position.set(
          anchor[0] + orbitCenter[0] + Math.cos(angle) * book.radius + bobX,
          anchor[1] + orbitCenter[1] + book.height + bobY + lift,
          anchor[2] + orbitCenter[2] + Math.sin(angle) * book.radius * 0.55,
        );
        dummy.rotation.set(
          Math.sin(t * 0.3 + p4) * 0.25 + s.tiltX,
          -angle + Math.PI / 2 + rot + s.tiltY,
          Math.sin(t * 0.21 + p1) * 0.2,
        );
      } else {
        const spin = book.spin || [1, 1, 1];
        const [bx, by, bz] = book.position;
        const [rx, ry, rz] = book.rotation || [0, 0, 0];
        dummy.position.set(
          anchor[0] + bx + bobX,
          anchor[1] + by + bobY + lift * (book.parallax ?? 1),
          anchor[2] + bz,
        );
        dummy.rotation.set(
          rx + rot * spin[0] + s.tiltX,
          ry + rot * spin[1] + s.tiltY,
          rz + rot * spin[2] * 0.5 + Math.sin(t * 0.3 + p4) * 0.15,
        );
      }

      const breathe = 1 + Math.sin(t * 0.8 + p1) * (motion.breathe || 0);
      dummy.scale.setScalar((book.scale || 1) * breathe);
      dummy.updateMatrix();
      leatherMesh.setMatrixAt(i, dummy.matrix);
      detailsMesh.setMatrixAt(i, dummy.matrix);
    }

    leatherMesh.instanceMatrix.needsUpdate = true;
    detailsMesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/*
        frustumCulled={false}: an InstancedMesh's bounding sphere is computed
        from the *un-instanced* geometry at the origin, so three.js would cull
        the whole set as soon as the origin leaves the view.
      */}
      <instancedMesh
        key={`leather-${count}`}
        ref={leatherRef}
        args={[leather, undefined, count]}
        frustumCulled={false}
        castShadow={shadows}
        receiveShadow={shadows}
      >
        <meshStandardMaterial roughness={0.72} metalness={0.05} />
      </instancedMesh>
      <instancedMesh
        key={`details-${count}`}
        ref={detailsRef}
        args={[details, detailMaterials, count]}
        frustumCulled={false}
        receiveShadow={shadows}
      />
    </group>
  );
}
