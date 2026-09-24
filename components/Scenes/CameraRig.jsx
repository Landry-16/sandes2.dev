'use client';

/**
 * CameraRig: moves the camera down the library shaft as the page scrolls.
 *
 * GSAP owns the *choreography*: one timeline, scrubbed by ScrollTrigger
 * across the whole document, tweens a plain `rig` object between the camera
 * keyframes in lib/sceneConfig.js. Each transition is placed on the timeline
 * at the exact scroll range where the next section slides into view, so
 * the camera always matches the DOM layout.
 *
 * React Three Fiber owns the *rendering*: every frame, the real camera eases
 * toward the rig (plus a small sway toward the mouse). Keeping the easing
 * here means one smoothing layer, synchronised with the render loop.
 *
 * GSAP also plays the intro: the candles are "lit" (runtime.light 0 → 1)
 * while the camera dollies in (runtime.dolly → 0).
 *
 * Reduced motion: no timeline and no intro. The camera cuts straight to the
 * active chapter's keyframe, and the canvas renders only on demand.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import { CAMERA, QUALITY, SECTIONS, SECTION_ORDER } from '@/lib/sceneConfig';
import { damp } from '@/lib/utils';
import { useSceneControls } from './useSceneControls';

gsap.registerPlugin(ScrollTrigger);

/** Flatten a keyframe into the shape GSAP tweens: { px, py, pz, tx, ty, tz }. */
function keyframe(id) {
  const { position, target } = SECTIONS[id].camera;
  return { px: position[0], py: position[1], pz: position[2], tx: target[0], ty: target[1], tz: target[2] };
}

/** Absolute document offset of an element's top edge. */
function pageTop(el) {
  return el.getBoundingClientRect().top + window.scrollY;
}

/**
 * Build the scroll-scrubbed camera timeline. Timeline time is measured in
 * *pixels of scroll*, so a tween placed at time 1200 plays exactly when the
 * page has scrolled 1200px.
 */
function buildTimeline(rig) {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const vh = window.innerHeight;
  const tl = gsap.timeline({
    defaults: { ease: 'sine.inOut' },
    scrollTrigger: { start: 0, end: maxScroll, scrub: true, invalidateOnRefresh: true },
  });

  for (let i = 1; i < SECTION_ORDER.length; i++) {
    const el = document.getElementById(SECTION_ORDER[i]);
    if (!el) continue;
    const top = pageTop(el);
    // From "section top enters the bottom of the screen" to "section top is
    // just under the fixed nav" (where anchor links land), so the camera has
    // fully arrived whenever a chapter is read.
    const start = Math.max(0, top - vh);
    const end = Math.min(maxScroll, top - vh * 0.15);
    tl.fromTo(
      rig,
      keyframe(SECTION_ORDER[i - 1]),
      { ...keyframe(SECTION_ORDER[i]), duration: Math.max(1, end - start), immediateRender: false },
      start,
    );
  }
  // Pad the timeline so its duration equals the scrollable distance.
  tl.set({}, {}, maxScroll);
  return tl;
}

/**
 * @param {object} props
 * @param {{ light: number, dolly: number }} props.runtime  shared intro values
 */
export default function CameraRig({ runtime }) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const reducedMotion = useStore((state) => state.reducedMotion);
  const rig = useMemo(() => keyframe('prologue'), []);
  const lookAt = useRef(new THREE.Vector3(rig.tx, rig.ty, rig.tz));
  const { mouseSway, damping } = useSceneControls('Camera', {
    mouseSway: { value: CAMERA.mouseSway, min: 0, max: 1.5 },
    damping: { value: CAMERA.damping, min: 0.5, max: 10 },
  });

  // Scroll choreography (or, under reduced motion, hard cuts per chapter).
  useEffect(() => {
    if (reducedMotion) {
      const snap = (id) => {
        Object.assign(rig, keyframe(id));
        runtime.light = 1;
        runtime.dolly = 0;
        invalidate();
      };
      snap(useStore.getState().activeSection);
      return useStore.subscribe((state, prev) => {
        if (state.activeSection !== prev.activeSection) snap(state.activeSection);
      });
    }

    let tl = buildTimeline(rig);
    let timer = 0;
    // Section offsets change when fonts load, filters change or the window
    // resizes; rebuild (debounced) whenever the document height changes.
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        tl.scrollTrigger?.kill();
        tl.kill();
        tl = buildTimeline(rig);
      }, 150);
    });
    observer.observe(document.body);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [reducedMotion, rig, runtime, invalidate]);

  // Intro: light the candles and dolly in.
  useEffect(() => {
    if (reducedMotion) return undefined;
    const intro = gsap.timeline();
    intro.to(runtime, { light: 1, duration: 2.8, ease: 'power2.out' }, 0);
    intro.to(runtime, { dolly: 0, duration: 3.4, ease: 'power3.out' }, 0.15);
    return () => intro.kill();
  }, [reducedMotion, runtime]);

  useFrame((_, delta) => {
    const { pointer, quality } = useStore.getState();
    const dt = Math.min(delta, 0.1);
    const swayOn = !reducedMotion && pointer.active && QUALITY[quality].mouseTilt;
    const sx = swayOn ? pointer.x * mouseSway : 0;
    const sy = swayOn ? pointer.y * mouseSway * 0.5 : 0;

    const px = rig.px + sx;
    const py = rig.py + sy;
    const pz = rig.pz + runtime.dolly;

    if (reducedMotion) {
      camera.position.set(px, py, pz);
      lookAt.current.set(rig.tx, rig.ty, rig.tz);
    } else {
      camera.position.x = damp(camera.position.x, px, damping, dt);
      camera.position.y = damp(camera.position.y, py, damping, dt);
      camera.position.z = damp(camera.position.z, pz, damping, dt);
      lookAt.current.x = damp(lookAt.current.x, rig.tx, damping, dt);
      lookAt.current.y = damp(lookAt.current.y, rig.ty, damping, dt);
      lookAt.current.z = damp(lookAt.current.z, rig.tz, damping, dt);
    }
    camera.lookAt(lookAt.current);
  });

  return null;
}
