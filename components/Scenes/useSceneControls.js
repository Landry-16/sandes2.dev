'use client';

/**
 * useSceneControls: live-tune 3D parameters with Leva in development,
 * with zero cost in production.
 *
 * Usage (same schema as Leva's useControls):
 *   const { maxTilt } = useSceneControls('Books', {
 *     maxTilt: { value: 0.35, min: 0, max: 1 },
 *   });
 *
 * - `npm run dev`  → a Leva panel appears when the URL contains `#debug`,
 *                    and every slider updates the scene instantly.
 * - `npm run build`→ `process.env.NODE_ENV` is inlined as "production", the
 *                    `require('leva')` branch below becomes dead code and
 *                    webpack never bundles Leva. The hook just returns the
 *                    default values.
 */
import { useMemo } from 'react';

// Resolved at build time: in production this is `null` and Leva is not bundled.
const leva = process.env.NODE_ENV === 'development' ? require('leva') : null;

/** Extract `{ key: defaultValue }` from a Leva schema. */
function defaultsOf(schema) {
  const out = {};
  for (const [key, entry] of Object.entries(schema)) {
    out[key] = entry !== null && typeof entry === 'object' && 'value' in entry ? entry.value : entry;
  }
  return out;
}

function useDevControls(folder, schema) {
  return leva.useControls(folder, schema, { collapsed: true });
}

function useStaticControls(folder, schema) {
  // Schemas are module-level constants, so computing once is enough.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => defaultsOf(schema), []);
}

/** @type {(folder: string, schema: Record<string, any>) => Record<string, any>} */
export const useSceneControls = leva ? useDevControls : useStaticControls;

/**
 * The Leva panel itself. Hidden unless the URL hash is `#debug`, so the dev
 * server looks like production by default. Renders nothing in production.
 */
export function SceneControlsPanel() {
  if (!leva) return null;
  const hidden = typeof window === 'undefined' || window.location.hash !== '#debug';
  const { Leva } = leva;
  return <Leva hidden={hidden} collapsed={false} titleBar={{ title: 'Scriptorium' }} />;
}
