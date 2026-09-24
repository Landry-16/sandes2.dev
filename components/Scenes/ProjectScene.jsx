'use client';

/**
 * ProjectScene: chapter II, the reading room behind the project cards.
 *
 * A slow ring of books orbits behind the grid. It sits deeper in the fog
 * than the hero, so it reads as a backdrop rather than competing with the
 * cards. Hovering or focusing a card (hoveredProject in the store) speeds
 * the orbit up and brightens the room's candle, see FloatingBooks and
 * SceneLights.
 */
import { PROJECT_BOOKS, SECTIONS } from '@/lib/sceneConfig';
import FloatingBooks from './FloatingBooks';

/**
 * @param {object} props
 * @param {object} props.quality  entry from QUALITY
 */
export default function ProjectScene({ quality }) {
  return (
    <FloatingBooks
      books={PROJECT_BOOKS.slice(0, quality.projectBooks)}
      preset="orbit"
      anchor={[0, SECTIONS.projects.y, 0]}
      orbitCenter={[0, 0, -5]}
      colorOffset={2}
      shadows={quality.shadows}
    />
  );
}
