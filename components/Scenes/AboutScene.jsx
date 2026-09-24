'use client';

/**
 * AboutScene: chapter III, a still life beside the biography: a desk, a
 * stack of books, a lit candle, and one quill circling it.
 *
 * The stack is static geometry (no per-frame work) and only the whole group
 * leans gently toward the cursor. The contact shadow is baked once
 * (`frames={1}`) because nothing under it moves.
 */
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { useStore } from '@/lib/store';
import { LEATHER, PALETTE, SECTIONS } from '@/lib/sceneConfig';
import { damp } from '@/lib/utils';
import { getBookDetailMaterials, getBookGeometry } from './FloatingBooks';
import { Candle } from './Lights';
import Quills from './Quills';

/** Books in the stack, bottom to top: [scale, yaw, x-offset, leather index]. */
const STACK = [
  [1.55, 0.05, 0.0, 0],
  [1.4, -0.12, 0.06, 1],
  [1.45, 0.18, -0.05, 2],
  [1.3, -0.04, 0.04, 4],
  [1.2, 0.22, -0.02, 3],
];
const BOOK_THICKNESS = 0.25;

const ORBITING_QUILL = [{ center: [0, 1.5, 0], radius: [1.8, 0.25, 1.2], speed: 0.22, phase: 1, scale: 0.6, sink: 0 }];

/**
 * @param {object} props
 * @param {object} props.quality  entry from QUALITY
 * @param {{ light: number }} props.runtime
 */
export default function AboutScene({ quality, runtime }) {
  const group = useRef();
  const { leather, details } = getBookGeometry();
  const detailMaterials = getBookDetailMaterials();
  // Beside the text on wide screens. On narrow screens the text fills the
  // width, so the still life shrinks into the lower-right corner instead of
  // sitting behind the paragraphs.
  const portrait = useThree((state) => state.size.width < state.size.height * 1.1);
  const baseY = SECTIONS.about.y - (portrait ? 3.4 : 1.3);
  const x = portrait ? 2.8 : 3.1;
  const scale = portrait ? 0.6 : 1;

  useFrame((_, delta) => {
    const { pointer, reducedMotion } = useStore.getState();
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    const on = pointer.active && !reducedMotion && quality.mouseTilt;
    g.rotation.y = damp(g.rotation.y, on ? pointer.x * 0.25 : 0, 2, dt);
    g.rotation.x = damp(g.rotation.x, on ? -pointer.y * 0.08 : 0, 2, dt);
  });

  let y = 0;
  const books = STACK.map(([scale, yaw, dx, leatherIndex], i) => {
    const h = BOOK_THICKNESS * scale;
    const position = [dx, y + h / 2, 0];
    y += h;
    return (
      // Lying flat: rotate the book so its thickness points up.
      <group key={i} position={position} rotation={[-Math.PI / 2, 0, yaw]} scale={scale}>
        <mesh geometry={leather} castShadow receiveShadow>
          <meshStandardMaterial color={LEATHER[leatherIndex]} roughness={0.72} />
        </mesh>
        <mesh geometry={details} material={detailMaterials} receiveShadow />
      </group>
    );
  });
  const stackTop = y;

  return (
    <group position={[x, baseY, -0.5]} scale={scale}>
      <group ref={group}>
        {/* Writing desk */}
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <boxGeometry args={[6.5, 0.2, 3.6]} />
          <meshStandardMaterial color={PALETTE.bgAccent} roughness={0.85} />
        </mesh>
        {books}
        <Candle position={[0.15, stackTop, 0.1]} height={0.95} intensity={32} runtime={runtime} />
        <Quills quills={ORBITING_QUILL} anchor={[0, 0, 0]} />
      </group>
      {quality.postprocessing && (
        <ContactShadows position={[0, 0.001, 0]} scale={6} blur={2.2} far={2.5} opacity={0.7} frames={1} />
      )}
    </group>
  );
}
