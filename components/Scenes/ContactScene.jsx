'use client';

/**
 * ContactScene: chapter IV, the colophon. The calmest scene on purpose:
 * one closed book, barely breathing, and the ambient dust. No quills, no
 * god rays, minimal mouse response, the page is winding down.
 */
import { useThree } from '@react-three/fiber';
import { SECTIONS } from '@/lib/sceneConfig';
import FloatingBooks from './FloatingBooks';

/**
 * @param {object} props
 * @param {object} props.quality  entry from QUALITY
 */
export default function ContactScene({ quality }) {
  const portrait = useThree((state) => state.size.width < state.size.height * 1.1);
  const book = portrait
    ? { position: [1.7, -3.1, -1], rotation: [0.25, -0.5, -0.12], scale: 1, parallax: 0.4, spin: [0.2, 1, 0.2] }
    : { position: [3.4, 0.1, -1], rotation: [0.25, -0.5, -0.12], scale: 1.9, parallax: 0.4, spin: [0.2, 1, 0.2] };

  return (
    <FloatingBooks
      books={[book]}
      preset="calm"
      anchor={[0, SECTIONS.contact.y, 0]}
      colorOffset={2}
      shadows={quality.shadows}
    />
  );
}
