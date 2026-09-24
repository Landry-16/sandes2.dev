'use client';

/**
 * HeroScene: chapter I, the prologue. The most immersive scene:
 * a drift of books and quills around the title, lit by candles, with god
 * rays falling from a high window behind them.
 *
 * On portrait screens the books move above and below the title (the
 * landscape layout would push them off-screen), and the low tier keeps only
 * a few of them.
 */
import { useThree } from '@react-three/fiber';
import { HERO_BOOKS, HERO_BOOKS_PORTRAIT, HERO_QUILLS, SECTIONS } from '@/lib/sceneConfig';
import FloatingBooks from './FloatingBooks';
import Quills from './Quills';
import { WindowSun } from './Lights';

/**
 * @param {object} props
 * @param {object} props.quality  entry from QUALITY
 * @param {(mesh: import('three').Mesh | null) => void} props.onSun
 *        callback ref for the window disc, handed to the god-ray pass
 */
export default function HeroScene({ quality, onSun }) {
  // Re-renders only when the orientation flips, not on every resize.
  const portrait = useThree((state) => state.size.width < state.size.height);
  const anchor = [0, SECTIONS.prologue.y, 0];

  const books = portrait ? HERO_BOOKS_PORTRAIT : HERO_BOOKS.slice(0, quality.heroBooks);
  const quills = portrait || quality.heroBooks < 4 ? HERO_QUILLS.slice(0, 1) : HERO_QUILLS;

  return (
    <group>
      <FloatingBooks books={books} preset="drift" anchor={anchor} shadows={quality.shadows} />
      <Quills quills={quills} anchor={anchor} />
      <WindowSun ref={onSun} dim={!quality.godRays} />
    </group>
  );
}
