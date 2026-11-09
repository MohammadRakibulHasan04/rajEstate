import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { FRAME_COUNT, getDrawableFrame, DrawableFrame } from '../../lib/frames';

gsap.registerPlugin(ScrollTrigger);

export interface Chapter {
  title: [string, string];
  body: string;
  /**
   * Optional manual window of overall hero scroll progress (0..1).
   * When omitted, windows are computed automatically with smooth overlap
   * based on the number of chapters.
   */
  at?: [number, number];
}

const DEFAULT_CHAPTERS: Chapter[] = [
  {
    title: ['আমরা আছি,', 'আপনার পাশে'],
    body: '',
  },
  {
    title: ['শুধু তালিকা নয়,', 'সাথে সহযোগিতা'],
    body: '',
  },
  {
    title: ['প্রতারণা থেকে দূরে থাকুন', 'নিশ্চিন্তে এগিয়ে চলুন'],
    body: '',
  },
  {
    title: ['খুঁজুন, যাচাই করুন', 'তারপর সিদ্ধান্ত নিন'],
    body: '',
  },
];

export interface CinematicHeroProps {
  images: React.MutableRefObject<HTMLImageElement[]>;
  ready: boolean;
  onExplore: () => void;
  /** Optional custom chapters list; defaults to the 4 editorial chapters. */
  chapters?: Chapter[];
}

/**
 * Computes evenly paced, gently overlapping scroll windows [start, end]
 * for any number of chapters so transitions never feel abrupt or leave dead gaps.
 */
function resolveChapterWindows(chapters: Chapter[], introEnd = 0.15): [number, number][] {
  const count = chapters.length;
  if (count === 0) return [];

  const startOffset = introEnd;
  const availableSpan = 1 - startOffset;
  const step = availableSpan / count;
  // Subtle cross-fade overlap so the next chapter begins rising as the previous one dissolves upward
  const overlap = Math.min(0.024, step * 0.12);

  return chapters.map((ch, i) => {
    if (ch.at) return ch.at;
    const isFirst = i === 0;
    const isLast = i === count - 1;
    const s = Math.max(0.08, startOffset + i * step - (isFirst ? 0.01 : overlap));
    const e = isLast ? 1 : Math.min(0.99, startOffset + (i + 1) * step + overlap);
    return [Number(s.toFixed(4)), Number(e.toFixed(4))];
  });
}

/**
 * Dynamically scales the pinned scroll runway based on both chapter count and frame count
 * so every frame and every editorial phase has generous room to breathe.
 */
function computeScrollDistance(chapterCount: number, frameCount: number): number {
  const vh = window.innerHeight;
  const isMobile = window.innerWidth < 768;
  const totalStages = Math.max(2, chapterCount + 1); // Intro + Chapters

  const perStageVh = isMobile ? 0.64 : 0.78;
  const perFrameVh = isMobile ? 0.055 : 0.075;

  const stageRunway = totalStages * perStageVh;
  const frameRunway = Math.min(isMobile ? 4.5 : 6.0, Math.max(1.8, frameCount * perFrameVh));

  return Math.round(vh * Math.max(stageRunway, frameRunway));
}

/**
 * Finds the best available decoded frame at `index`, falling back to the nearest
 * loaded neighbor if a frame is still decoding or missing.
 */
function resolveReadyDrawable(imgs: HTMLImageElement[], index: number): DrawableFrame | null {
  const len = imgs.length;
  if (len === 0) return null;
  const clamped = Math.min(len - 1, Math.max(0, index));

  const direct = getDrawableFrame(imgs[clamped]);
  if (direct) return direct;

  for (let offset = 1; offset < len; offset++) {
    const prev = clamped - offset;
    if (prev >= 0) {
      const d = getDrawableFrame(imgs[prev]);
      if (d) return d;
    }
    const next = clamped + offset;
    if (next < len) {
      const d = getDrawableFrame(imgs[next]);
      if (d) return d;
    }
  }
  return null;
}

/**
 * Draws a frame covering the canvas with built-in camera zoom (`scale`) and
 * clamped parallax pan (`panX`, `panY` in -1..1 of available bleed margin).
 * Performing camera scale/pan inside `drawImage` avoids CSS re-rasterization of the canvas layer.
 */
function drawCoverWithParallax(
  ctx: CanvasRenderingContext2D,
  drawable: DrawableFrame,
  w: number,
  h: number,
  alpha: number,
  scale: number,
  panXNorm: number,
  panYNorm: number
) {
  const baseScale = Math.max(w / drawable.width, h / drawable.height);
  const safeScale = Math.max(1.02, scale);
  const s = baseScale * safeScale;
  const dw = drawable.width * s;
  const dh = drawable.height * s;

  // Maximum safe pan distance so the image edge is never exposed
  const bleedX = Math.max(0, (dw - w) * 0.5);
  const bleedY = Math.max(0, (dh - h) * 0.5);
  const maxPanPxX = Math.min(bleedX, w * 0.035);
  const maxPanPxY = Math.min(bleedY, h * 0.045);

  const dx = (w - dw) * 0.5 + Math.max(-1, Math.min(1, panXNorm)) * maxPanPxX;
  const dy = (h - dh) * 0.5 + Math.max(-1, Math.min(1, panYNorm)) * maxPanPxY;

  ctx.globalAlpha = alpha;
  ctx.drawImage(drawable.source, dx, dy, dw, dh);
  ctx.globalAlpha = 1;
}

/**
 * Adaptive sub-frame blend factor based on total frame count and scroll velocity:
 * - Low frame counts (<= 35): full C1-continuous Hermite smoothstep across the frame interval
 * - Medium frame counts (36..75): tighter smoothstep window around the midpoint
 * - High frame counts (> 75): crisp frame stepping during fast scroll, micro-blend when settling
 */
function computeFrameBlend(t: number, totalFrames: number, absVelocity: number): number {
  if (totalFrames <= 1 || t <= 0.002) return 0;
  if (t >= 0.998) return 1;

  if (totalFrames <= 35) {
    // Smoothstep C1 curve eliminates keyframe "pulsing" on low-to-medium frame counts
    return t * t * (3 - 2 * t);
  }

  if (totalFrames <= 75) {
    const margin = 0.15;
    const remapped = Math.max(0, Math.min(1, (t - margin) / (1 - 2 * margin)));
    return remapped * remapped * (3 - 2 * remapped);
  }

  // High frame count (75+ frames): crisp when moving fast, soft blend when slow
  if (absVelocity > 0.004) {
    return t > 0.5 ? 1 : 0;
  }
  return t * t * (3 - 2 * t);
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({
  images,
  ready,
  onExplore,
  chapters = DEFAULT_CHAPTERS,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const shadeLeftRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const introTitleRef = useRef<HTMLHeadingElement>(null);
  const introSubRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chapterInnerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railFillRef = useRef<HTMLDivElement>(null);
  const railDotRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const chapterWindows = useMemo(() => resolveChapterWindows(chapters), [chapters]);

  // Smooth physics state driven by GSAP ticker
  const scrollState = useRef({
    targetProgress: 0,
    smoothProgress: 0,
    targetPointerX: 0,
    targetPointerY: 0,
    smoothPointerX: 0,
    smoothPointerY: 0,
    lastRenderedProgress: -1,
    lastRenderedPointerX: -99,
    lastRenderedPointerY: -99,
    lastRenderedCount: -1,
  });

  const wasReadyOnMount = useRef(ready);

  /**
   * Renders the interpolated frame sequence + continuous camera zoom/pan parallax.
   * Automatically adapts to any number of frames in `images.current`.
   */
  const renderCanvas = (force = false, velocity = 0) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || canvas.width === 0 || canvas.height === 0) return;

    const imgs = images.current;
    const count = imgs.length;
    const state = scrollState.current;
    const p = Math.max(0, Math.min(1, state.smoothProgress));
    const px = state.smoothPointerX;
    const py = state.smoothPointerY;

    if (
      !force &&
      count === state.lastRenderedCount &&
      Math.abs(p - state.lastRenderedProgress) < 0.0001 &&
      Math.abs(px - state.lastRenderedPointerX) < 0.0004 &&
      Math.abs(py - state.lastRenderedPointerY) < 0.0004
    ) {
      return;
    }

    const primaryIdx = (() => {
      if (count <= 1) return 0;
      // Smoothly map scroll 0..1 across all available frames with a gentle ease-out tail at the very end
      const frameCurve = p < 0.92 ? (p / 0.92) * 0.94 : 0.94 + (1 - Math.pow(1 - (p - 0.92) / 0.08, 2)) * 0.06;
      return Math.min(count - 1, Math.max(0, frameCurve * (count - 1)));
    })();

    const i = Math.floor(primaryIdx);
    const t = primaryIdx - i;
    const frameA = resolveReadyDrawable(imgs, i);

    if (!frameA) {
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const frameB = i + 1 < count ? resolveReadyDrawable(imgs, i + 1) : null;
    const absVel = Math.abs(velocity);

    // Dynamic smoothing quality: 'medium' during rapid scroll for high frame rate, 'high' when settling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = absVel > 0.0035 ? 'medium' : 'high';

    // Continuous 3D-like camera push-out (1.10 -> 1.028) + vertical parallax pan (-0.85 -> +0.85)
    const easeOutProgress = 1 - (1 - p) * (1 - p);
    const cameraScale = 1.1 - 0.072 * easeOutProgress;
    const cameraPanX = -px * 0.45;
    const cameraPanY = (p * 2 - 1) * 0.82 - py * 0.45;

    drawCoverWithParallax(ctx, frameA, canvas.width, canvas.height, 1, cameraScale, cameraPanX, cameraPanY);

    if (frameB && frameB.source !== frameA.source) {
      const blendAlpha = computeFrameBlend(t, count, absVel);
      if (blendAlpha > 0.004) {
        drawCoverWithParallax(
          ctx,
          frameB,
          canvas.width,
          canvas.height,
          blendAlpha,
          cameraScale,
          cameraPanX,
          cameraPanY
        );
      }
    }

    state.lastRenderedProgress = p;
    state.lastRenderedPointerX = px;
    state.lastRenderedPointerY = py;
    state.lastRenderedCount = count;
  };

  // Canvas sizing (DPR-aware, capped at 2x for performance)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext('2d', { alpha: false, desynchronized: true }) || canvas.getContext('2d', { alpha: false });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      renderCanvas(true);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subtle pointer depth parallax on desktop devices
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const mq = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!mq.matches) return;

    const onPointerMove = (e: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
      scrollState.current.targetPointerX = Math.max(-1, Math.min(1, nx));
      scrollState.current.targetPointerY = Math.max(-1, Math.min(1, ny));
    };

    const onPointerLeave = () => {
      scrollState.current.targetPointerX = 0;
      scrollState.current.targetPointerY = 0;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    section.addEventListener('pointerleave', onPointerLeave, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  // Master scroll-driven parallax choreography + exponential damping ticker
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let tickerFn: gsap.TickerCallback | null = null;

    const ctx = gsap.context(() => {
      const introLines = gsap.utils.toArray<HTMLElement>('[data-intro-line]', section);
      const introLineWraps = gsap.utils.toArray<HTMLElement>('[data-intro-parallax]', section);
      const introFades = gsap.utils.toArray<HTMLElement>('[data-intro-fade]', section);

      if (wasReadyOnMount.current) {
        gsap.set(introLines, { yPercent: 0, force3D: true });
        gsap.set(introFades, { autoAlpha: 1, y: 0, force3D: true });
        gsap.set(canvasRef.current, { autoAlpha: 1 });
      } else {
        gsap.set(introLines, { yPercent: 115, force3D: true });
        gsap.set(introFades, { autoAlpha: 0, y: 24, force3D: true });
        gsap.set(canvasRef.current, { autoAlpha: 0 });
      }

      // Paused master timeline normalized to duration = 1.0, driven directly by our damped ticker
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: 'none', force3D: true },
      });

      // Ensure timeline always spans exactly [0, 1]
      tl.set({}, {}, 1);

      const isMobile = window.innerWidth < 768;

      // 1. Intro differential multi-line parallax exit (0.00 -> 0.16)
      introLineWraps.forEach((wrap, idx) => {
        // Upper lines travel slightly faster than lower lines for genuine depth separation
        const yTravel = isMobile ? -42 + idx * 16 : -92 + idx * 22;
        tl.fromTo(
          wrap,
          { y: 0 },
          { y: yTravel, duration: 0.16, ease: 'power1.inOut' },
          0
        );
      });

      tl.fromTo(
        introSubRef.current,
        { y: 0, autoAlpha: 1 },
        { y: isMobile ? -18 : -32, autoAlpha: 0, duration: 0.12, ease: 'power2.inOut' },
        0.01
      ).fromTo(
        introRef.current,
        { autoAlpha: 1 },
        {
          autoAlpha: 0,
          duration: 0.14,
          ease: 'power2.inOut',
          onUpdate: function () {
            if (introRef.current) {
              introRef.current.style.pointerEvents = scrollState.current.smoothProgress > 0.11 ? 'none' : 'auto';
            }
          },
        },
        0.02
      );

      // 2. Blueprint grid & atmosphere continuous parallax
      tl.fromTo(
        gridRef.current,
        { autoAlpha: 0.9, scale: 1, yPercent: 0 },
        { autoAlpha: 0, scale: 1.14, yPercent: -12, duration: 0.56, ease: 'sine.inOut' },
        0.08
      );

      if (shadeLeftRef.current) {
        tl.fromTo(
          shadeLeftRef.current,
          { opacity: 0.82 },
          { opacity: 1, duration: 0.25, ease: 'sine.out' },
          0.1
        );
      }

      // 3. Chapters: 3-phase choreography (Smooth Enter -> Slow Reading Drift Plateau -> Smooth Exit)
      //    with separate parallax planes for Line 1, Gold Italic Line 2, and Body/CTA
      chapterRefs.current.forEach((el, i) => {
        if (!el || !chapterWindows[i]) return;
        const [s, e] = chapterWindows[i];
        const span = Math.max(0.05, e - s);
        const isLast = i === chapters.length - 1;

        const enterDur = isLast ? span * 0.42 : span * 0.3;
        const exitDur = isLast ? 0 : span * 0.28;
        const holdStart = s + enterDur;
        const exitStart = e - exitDur;
        const holdDur = Math.max(0.01, exitStart - holdStart);

        const line1 = el.querySelector<HTMLElement>('[data-ch-line1]');
        const line2 = el.querySelector<HTMLElement>('[data-ch-line2]');
        const body = el.querySelector<HTMLElement>('[data-ch-body]');

        // Container smooth fade-in & fade-out
        tl.fromTo(
          el,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: enterDur * 0.88, ease: 'sine.out' },
          s
        );
        if (!isLast) {
          tl.to(
            el,
            { autoAlpha: 0, duration: exitDur * 0.88, ease: 'sine.in' },
            exitStart + exitDur * 0.12
          );
        }

        // Plane 1: Primary Headline Line 1 (Foreground)
        if (line1) {
          const l1EnterY = isMobile ? 30 : 68;
          const l1HoldY = isMobile ? -3 : -12;
          const l1ExitY = isMobile ? -34 : -72;

          tl.fromTo(
            line1,
            { y: l1EnterY },
            { y: isMobile ? 4 : 10, duration: enterDur, ease: 'power2.out' },
            s
          );
          if (isLast) {
            tl.to(
              line1,
              { y: isMobile ? -2 : -6, duration: holdDur, ease: 'sine.out' },
              holdStart
            );
          } else {
            tl.to(
              line1,
              { y: l1HoldY, duration: holdDur, ease: 'none' },
              holdStart
            ).to(
              line1,
              { y: l1ExitY, duration: exitDur, ease: 'power2.in' },
              exitStart
            );
          }
        }

        // Plane 2: Gold Italic Line 2 (Mid-foreground, deeper parallax offset & stagger)
        if (line2) {
          const l2EnterY = isMobile ? 42 : 94;
          const l2HoldY = isMobile ? -2 : -8;
          const l2ExitY = isMobile ? -26 : -52;

          const staggerOffset = Math.min(0.018, span * 0.05);
          const line2HoldStart = s + staggerOffset + enterDur;
          const line2HoldDur = Math.max(0.01, exitStart - line2HoldStart);

          tl.fromTo(
            line2,
            { y: l2EnterY, autoAlpha: 0 },
            {
              y: isMobile ? 6 : 14,
              autoAlpha: 1,
              duration: enterDur,
              ease: 'power2.out',
            },
            s + staggerOffset
          );

          if (isLast) {
            tl.to(
              line2,
              { y: 0, duration: line2HoldDur, ease: 'sine.out' },
              line2HoldStart
            );
          } else {
            tl.to(
              line2,
              { y: l2HoldY, duration: line2HoldDur, ease: 'none' },
              line2HoldStart
            ).to(
              line2,
              { y: l2ExitY, autoAlpha: 0, duration: exitDur, ease: 'power2.in' },
              exitStart
            );
          }
        }

        // Plane 3: Body & Final CTA (Deepest foreground plane)
        if (body) {
          const bodyEnterY = isMobile ? 48 : 108;
          const bodyExitY = isMobile ? -18 : -38;

          const bodyStagger = Math.min(0.03, span * 0.09);
          const bodyEnterDur = enterDur * 1.05;
          const bodyHoldStart = s + bodyStagger + bodyEnterDur;
          const bodyHoldDur = Math.max(0.01, exitStart - bodyHoldStart);

          tl.fromTo(
            body,
            { y: bodyEnterY, autoAlpha: 0 },
            {
              y: isMobile ? 4 : 8,
              autoAlpha: 1,
              duration: bodyEnterDur,
              ease: 'power2.out',
            },
            s + bodyStagger
          );

          if (isLast) {
            tl.to(
              body,
              { y: 0, duration: bodyHoldDur, ease: 'sine.out' },
              bodyHoldStart
            );
          } else {
            tl.to(
              body,
              { y: isMobile ? -1 : -4, duration: bodyHoldDur, ease: 'none' },
              bodyHoldStart
            ).to(
              body,
              { y: bodyExitY, autoAlpha: 0, duration: exitDur, ease: 'power2.in' },
              exitStart
            );
          }
        }
      });

      // ScrollTrigger pins the hero and updates `targetProgress` without forced snap hijacking
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${computeScrollDistance(chapters.length, images.current.length || FRAME_COUNT)}`,
        pin: true,
        anticipatePin: 1,
        refreshPriority: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          scrollState.current.targetProgress = self.progress;
        },
        onRefresh: (self) => {
          scrollState.current.targetProgress = self.progress;
          scrollState.current.smoothProgress = self.progress;
          tl.progress(self.progress);
          renderCanvas(true, 0);
        },
      });

      // Initialize progress to current scroll position immediately
      scrollState.current.targetProgress = st.progress;
      scrollState.current.smoothProgress = st.progress;
      tl.progress(st.progress);
      renderCanvas(true, 0);

      // Frame-rate independent exponential smoothing loop (60Hz / 120Hz / 144Hz adaptive)
      tickerFn = () => {
        const state = scrollState.current;
        const deltaRatio = Math.min(3, gsap.ticker.deltaRatio(60));

        // Exponential damping factors
        const scrollLerp = reducedMotion ? 1 : 1 - Math.pow(1 - 0.135, deltaRatio);
        const pointerLerp = reducedMotion ? 1 : 1 - Math.pow(1 - 0.075, deltaRatio);

        const diffP = state.targetProgress - state.smoothProgress;
        const diffX = state.targetPointerX - state.smoothPointerX;
        const diffY = state.targetPointerY - state.smoothPointerY;

        const isScrollSettled = Math.abs(diffP) < 0.00008;
        const isPointerSettled = Math.abs(diffX) < 0.0003 && Math.abs(diffY) < 0.0003;

        if (isScrollSettled) {
          state.smoothProgress = state.targetProgress;
        } else {
          state.smoothProgress += diffP * scrollLerp;
        }

        if (isPointerSettled) {
          state.smoothPointerX = state.targetPointerX;
          state.smoothPointerY = state.targetPointerY;
        } else {
          state.smoothPointerX += diffX * pointerLerp;
          state.smoothPointerY += diffY * pointerLerp;
        }

        const p = state.smoothProgress;

        // Sync GSAP master timeline to damped progress
        if (Math.abs(tl.progress() - p) > 0.00005) {
          tl.progress(p);
        }

        // Sync progress rail and chapter marker dots
        if (railFillRef.current) {
          railFillRef.current.style.transform = `scaleY(${p})`;
        }

        railDotRefs.current.forEach((dot, idx) => {
          if (!dot) return;
          const threshold = idx === 0 ? 0 : chapterWindows[idx - 1]?.[0] ?? 1;
          const active = p >= threshold - 0.02;
          dot.style.opacity = active ? '1' : '0.28';
          dot.style.transform = active ? 'translateX(-50%) scale(1.25)' : 'translateX(-50%) scale(1)';
        });

        // Subtle pointer counter-parallax on foreground chapter inner containers
        if (!isPointerSettled) {
          const tx = (state.smoothPointerX * 9).toFixed(2);
          const ty = (state.smoothPointerY * 7).toFixed(2);
          chapterInnerRefs.current.forEach((inner) => {
            if (inner) {
              inner.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
            }
          });
        }

        // Render canvas frame sequence + camera depth
        renderCanvas(false, diffP);
      };

      gsap.ticker.add(tickerFn);
    }, section);

    return () => {
      if (tickerFn) gsap.ticker.remove(tickerFn);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters, chapterWindows]);

  // Intro choreography once frames are decoded
  useEffect(() => {
    if (!ready || !sectionRef.current) return;
    renderCanvas(true);
    if (wasReadyOnMount.current) {
      ScrollTrigger.refresh();
      return;
    }
    const section = sectionRef.current;
    const tl = gsap.timeline();
    tl.to(canvasRef.current, { autoAlpha: 1, duration: 1.5, ease: 'power2.out' }, 0)
      .to(
        section.querySelectorAll('[data-intro-line]'),
        { yPercent: 0, duration: 1.45, stagger: 0.11, ease: 'expo.out', force3D: true },
        0.12
      )
      .to(
        section.querySelectorAll('[data-intro-fade]'),
        { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', force3D: true },
        0.5
      );
    ScrollTrigger.refresh();
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <section
      id="home"
      ref={sectionRef}
      aria-label="AURA — from blueprint to residence"
      className="relative h-screen h-[100dvh] w-full overflow-hidden bg-[#070b14] text-[#f4efe6] select-none"
    >
      {/* Layer 0: GPU-accelerated frame sequence canvas */}
      <div ref={stageRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full block" aria-hidden="true" />
      </div>

      {/* Layer 1: atmosphere & depth overlays */}
      <div ref={gridRef} className="hero-grid will-change-transform" aria-hidden="true" />
      <div ref={shadeLeftRef} className="hero-shade-left" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {/* Layer 2: intro */}
      <div
        ref={introRef}
        className="absolute inset-0 z-20 flex flex-col justify-center md:justify-end px-5 sm:px-8 md:px-12 lg:px-20 pt-20 pb-12 sm:pb-16 md:pb-[15vh] lg:pb-[14vh] will-change-[opacity]"
      >
        <div className="relative max-w-4xl sm:max-w-5xl w-full">
          <h1
            ref={introTitleRef}
            className="font-display font-light text-[2.1rem] xs:text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.4vw] xl:text-[4.2vw] leading-[1.34] sm:leading-[1.38] md:leading-[1.42] tracking-normal py-1"
          >
            <span data-intro-parallax className="block will-change-transform">
              <span className="reveal-line">
                <span data-intro-line className="py-[0.08em] block">রাজশাহীতে খুঁজছেন</span>
              </span>
            </span>
            <span data-intro-parallax className="block will-change-transform">
              <span className="reveal-line">
                <span data-intro-line className="py-[0.08em] block">
                  মনের মতো <em className="italic text-gradient-gold pr-[0.1em]">ঠিকানা?</em>
                </span>
              </span>
            </span>
          </h1>

          <div
            ref={introSubRef}
            className="mt-6 sm:mt-8 md:mt-10 flex flex-col items-start gap-4 sm:gap-6 will-change-transform"
          >
            <div data-intro-fade className="flex items-center">
              <button
                id="hero-explore-btn"
                onClick={onExplore}
                className="btn-gold text-[10px] sm:text-[11px] px-6 py-3.5 sm:px-7 sm:py-4"
              >
                Explore Residences <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 3: multi-plane parallax chapters */}
      {chapters.map((c, i) => {
        const isLast = i === chapters.length - 1;
        return (
          <div
            key={i}
            ref={(el) => {
              chapterRefs.current[i] = el;
            }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center px-5 sm:px-8 md:px-12 lg:px-20 pt-20 pb-12 sm:pb-16 md:pb-16 will-change-[opacity]"
          >
            <div
              ref={(el) => {
                chapterInnerRefs.current[i] = el;
              }}
              className="relative max-w-4xl sm:max-w-5xl will-change-transform w-full"
            >
              <div data-ch-title>
                <h2 className="font-display font-light text-[1.85rem] xs:text-[2.15rem] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.34] sm:leading-[1.38] md:leading-[1.42] tracking-normal py-1">
                  <span data-ch-line1 className="block will-change-transform py-[0.1em]">
                    {c.title[0]}
                  </span>
                  <span data-ch-line2 className="block will-change-transform">
                    <em className="italic text-gradient-gold inline-block py-[0.1em] pr-[0.12em]">
                      {c.title[1]}
                    </em>
                  </span>
                </h2>
              </div>
              {(c.body || isLast) && (
                <div data-ch-body className="mt-6 sm:mt-8 will-change-transform">
                  {c.body && (
                    <p className="text-[15px] sm:text-base lg:text-lg leading-[1.65] text-slate-200/90 font-normal max-w-lg">
                      {c.body}
                    </p>
                  )}
                  {isLast && (
                    <div className="pointer-events-auto mt-6 sm:mt-8 md:mt-9 flex flex-wrap gap-3">
                      <button
                        id="hero-final-explore-btn"
                        onClick={onExplore}
                        className="btn-gold text-[10px] sm:text-[11px] px-6 py-3.5 sm:px-7 sm:py-4"
                      >
                        View the Collection <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Layer 4: progress rail with phase markers */}
      <aside
        aria-hidden="true"
        className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 z-30 hidden md:block"
      >
        <div className="relative w-px h-[38vh] bg-white/10">
          <div
            ref={railFillRef}
            className="absolute inset-0 origin-top bg-gradient-to-b from-[#8fc3ff] via-[#d1ad7a] to-[#f1dfbd] will-change-transform"
            style={{ transform: 'scaleY(0)' }}
          />
          {[0, ...chapterWindows.map(([s]) => s)].map((pos, idx) => (
            <span
              key={idx}
              ref={(el) => {
                railDotRefs.current[idx] = el;
              }}
              className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#f1dfbd] transition-[opacity,transform] duration-300"
              style={{
                top: `${Math.min(100, Math.max(0, pos * 100))}%`,
                opacity: idx === 0 ? 1 : 0.28,
              }}
            />
          ))}
        </div>
      </aside>
    </section>
  );
};
