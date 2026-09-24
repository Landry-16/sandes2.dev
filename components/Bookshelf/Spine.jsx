/**
 * Spine: one project standing on the shelf, drawn as a book spine.
 *
 * It is a real <button>: focusable, announced with its title, and marked
 * `aria-pressed` when its book is open in the detail panel. Colour and
 * height vary per project (derived from the slug, so they never change
 * between visits) to make the shelf feel hand-arranged.
 *
 * @param {object}   props
 * @param {object}   props.project   entry from lib/content.js
 * @param {number}   props.index     position in the full project list
 * @param {boolean}  props.selected  true when this book is open
 * @param {(slug: string) => void} props.onSelect
 */
import { LEATHER } from '@/lib/sceneConfig';
import styles from './Bookshelf.module.css';

/** Small stable hash so each slug always gets the same look. */
function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export default function Spine({ project, index, selected, onSelect }) {
  const h = hash(project.slug);
  const style = {
    '--spine-color': LEATHER[(index + h) % LEATHER.length],
    '--spine-height': `${13.5 + (h % 5) * 0.9}rem`,
  };

  return (
    <button
      type="button"
      className={styles.spine}
      style={style}
      aria-pressed={selected}
      aria-controls="book-detail"
      onClick={() => onSelect(project.slug)}
    >
      <span className={styles.spineTitle}>{project.title}</span>
      <span className={styles.spineYear} aria-hidden="true">
        {project.year}
      </span>
    </button>
  );
}
