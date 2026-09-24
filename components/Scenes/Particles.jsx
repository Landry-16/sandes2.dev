'use client';

/**
 * Particles: ink motes, gold dust and loose pages rising through the whole
 * library shaft.
 *
 * Performance: hundreds of particles are two InstancedMeshes (motes + pages),
 * i.e. two draw calls. Their state lives in typed arrays created once; the
 * per-frame loop only does arithmetic and writes instance matrices, with no
 * allocations, so the garbage collector never interrupts the animation.
 *
 * Behaviour:
 *   - slow upward drift with a per-particle sideways wobble. Particles live
 *     in a band centred on the camera and are recycled across it, so the
 *     density is the same in every chapter while they still parallax;
 *   - near the cursor, motes speed up, swell and are gently pulled in, so
 *     density visibly increases around the pointer. They drift home after.
 *
 * Outside the prologue the motes fade to half strength so they never
 * compete with body text and project cards.
 *
 * The motes use an unlit additive material with `toneMapped={false}` so
 * their colour can exceed 1.0; that HDR brightness is what the bloom pass
 * picks up to make them glow.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import { PALETTE, PARTICLES } from '@/lib/sceneConfig';
import { createRandom, damp, smoothstep } from '@/lib/utils';
import { useSceneControls } from './useSceneControls';

const dummy = new THREE.Object3D();
const color = new THREE.Color();
const ray = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // z = 0
const ndc = new THREE.Vector2();
const cursorWorld = new THREE.Vector3();

const CONTROLS = {
  driftSpeed: { value: PARTICLES.driftSpeed, min: 0, max: 1 },
  wobble: { value: PARTICLES.wobble, min: 0, max: 1.5 },
  cursorRadius: { value: PARTICLES.cursorRadius, min: 0.5, max: 6 },
  cursorSpeedBoost: { value: PARTICLES.cursorSpeedBoost, min: 0, max: 10 },
  cursorScaleBoost: { value: PARTICLES.cursorScaleBoost, min: 0, max: 4 },
  cursorPull: { value: PARTICLES.cursorPull, min: 0, max: 3 },
};

/**
 * Allocate and seed the simulation arrays for `n` particles.
 * @param {number} n
 * @param {number} seed
 */
function createField(n, seed) {
  const rand = createRandom(seed);
  const [zMin, zMax] = PARTICLES.depth;
  const field = {
    homeX: new Float32Array(n),
    x: new Float32Array(n),
    y: new Float32Array(n),
    z: new Float32Array(n),
    speed: new Float32Array(n),
    phase: new Float32Array(n),
    freq: new Float32Array(n),
    size: new Float32Array(n),
    kind: new Uint8Array(n), // 0 = dust, 1 = ink
  };
  for (let i = 0; i < n; i++) {
    field.homeX[i] = field.x[i] = (rand() - 0.5) * PARTICLES.width;
    field.y[i] = (rand() - 0.5) * PARTICLES.band;
    field.z[i] = zMin + rand() * (zMax - zMin);
    field.speed[i] = 0.5 + rand();
    field.phase[i] = rand() * Math.PI * 2;
    field.freq[i] = 0.3 + rand() * 0.7;
    field.kind[i] = rand() < PARTICLES.mix.dust ? 0 : 1;
    field.size[i] = field.kind[i] === 0 ? 0.01 + rand() * 0.022 : 0.014 + rand() * 0.02;
  }
  return field;
}

/**
 * @param {object} props
 * @param {number} props.count  number of dust/ink motes
 * @param {number} props.pages  number of loose pages
 */
export default function Particles({ count, pages }) {
  const motesRef = useRef();
  const pagesRef = useRef();
  const controls = useSceneControls('Particles', CONTROLS);

  const motes = useMemo(() => createField(count, 7), [count]);
  const leaves = useMemo(() => createField(pages, 99), [pages]);

  const moteGeometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const pageGeometry = useMemo(() => new THREE.PlaneGeometry(0.16, 0.22), []);

  // Colour each mote once. Values above 1 are intentional (HDR → bloom).
  useLayoutEffect(() => {
    const mesh = motesRef.current;
    if (!mesh) return;
    const rand = createRandom(3);
    for (let i = 0; i < count; i++) {
      if (motes.kind[i] === 0) {
        color.set(rand() < 0.65 ? PALETTE.lightCandle : PALETTE.goldPrimary).multiplyScalar(1.4 + rand() * 1.6);
      } else {
        color.set(PALETTE.accentPrimary).multiplyScalar(0.7 + rand() * 0.6);
      }
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, motes]);

  useFrame((frame, delta) => {
    const { pointer, reducedMotion, activeSection } = useStore.getState();

    // Full strength behind the hero, quieter behind reading content.
    const material = motesRef.current?.material;
    if (material) {
      const target = activeSection === 'prologue' ? 0.9 : 0.45;
      material.opacity = reducedMotion ? target : damp(material.opacity, target, 2, Math.min(delta, 0.1));
    }

    const dt = reducedMotion ? 0 : Math.min(delta, 0.1);
    const t = reducedMotion ? 0 : frame.clock.elapsedTime;

    // Project the cursor onto the z = 0 plane in front of the camera.
    let cx = 0;
    let cy = 0;
    const cursorOn = pointer.active && !reducedMotion;
    if (cursorOn) {
      ndc.set(pointer.x, pointer.y);
      ray.setFromCamera(ndc, frame.camera);
      if (ray.ray.intersectPlane(plane, cursorWorld)) {
        cx = cursorWorld.x;
        cy = cursorWorld.y;
      }
    }

    const span = PARTICLES.band;
    const top = frame.camera.position.y + span / 2;
    const bottom = top - span;
    const { driftSpeed, wobble, cursorRadius, cursorSpeedBoost, cursorScaleBoost, cursorPull } = controls;

    /** Advance one field and write its matrices. */
    const step = (field, n, mesh, isPage) => {
      if (!mesh) return;
      for (let i = 0; i < n; i++) {
        // Influence 1 at the cursor, 0 beyond `cursorRadius`.
        let influence = 0;
        if (cursorOn) {
          const dx = cx - field.x[i];
          const dy = cy - field.y[i];
          influence = 1 - smoothstep(0, cursorRadius, Math.sqrt(dx * dx + dy * dy));
          // Gather toward the cursor, then drift back home when it leaves.
          field.homeX[i] += dx * influence * cursorPull * dt * 0.5;
          field.y[i] += dy * influence * cursorPull * dt * 0.25;
        }

        const speed = driftSpeed * field.speed[i] * (isPage ? 0.6 : 1) * (1 + influence * cursorSpeedBoost);
        field.y[i] += speed * dt;
        // Recycle across the band that follows the camera.
        if (field.y[i] > top) field.y[i] -= span;
        else if (field.y[i] < bottom) field.y[i] += span;

        const ph = field.phase[i];
        const f = field.freq[i];
        field.x[i] = field.homeX[i] + Math.sin(t * f + ph) * wobble * (isPage ? 2 : 1);
        dummy.position.set(field.x[i], field.y[i], field.z[i] + Math.cos(t * f * 0.7 + ph) * wobble * 0.5);

        if (isPage) {
          // Pages flutter: tumbling on all axes at their own pace.
          dummy.rotation.set(Math.sin(t * f + ph) * 1.2, t * f * 0.8 + ph, Math.cos(t * f * 0.9 + ph) * 0.6);
          dummy.scale.setScalar(1 + influence * 0.4);
        } else {
          const twinkle = 0.8 + 0.2 * Math.sin(t * 2.3 + ph * 3);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(field.size[i] * twinkle * (1 + influence * cursorScaleBoost));
        }
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    step(motes, count, motesRef.current, false);
    step(leaves, pages, pagesRef.current, true);
  });

  return (
    <group>
      <instancedMesh key={`motes-${count}`} ref={motesRef} args={[moteGeometry, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial
          toneMapped={false}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
      {pages > 0 && (
        <instancedMesh key={`pages-${pages}`} ref={pagesRef} args={[pageGeometry, undefined, pages]} frustumCulled={false}>
          <meshStandardMaterial
            color={PALETTE.lightSoft}
            roughness={0.9}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </instancedMesh>
      )}
    </group>
  );
}
