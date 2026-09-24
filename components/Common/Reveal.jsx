'use client';

/**
 * Reveal: fades and lifts its children into place the first time they
 * scroll into view (Framer Motion `whileInView`).
 *
 * - Runs once per element, then stays put.
 * - Uses the `m` component from LazyMotion (see Portfolio), so it adds only
 *   the small DOM-animation feature bundle, not all of Framer Motion.
 * - With `prefers-reduced-motion`, MotionConfig drops the movement and keeps
 *   a plain fade.
 * - `data-reveal` lets a <noscript> style (app/layout.jsx) show the content
 *   when JavaScript is off, so nothing is ever stuck invisible.
 *
 * @param {object}  props
 * @param {keyof JSX.IntrinsicElements} [props.as]  element to render (default div)
 * @param {number}  [props.delay]  seconds
 * @param {number}  [props.y]      starting vertical offset in px
 * @param {string}  [props.className]
 * @param {React.ReactNode} props.children
 */
import { m } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

export default function Reveal({ as = 'div', delay = 0, y = 24, className, children, ...rest }) {
  const Component = m[as] ?? m.div;
  return (
    <Component
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Component>
  );
}
