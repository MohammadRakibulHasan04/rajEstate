import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { FRAME_COUNT } from '../../lib/frames';

gsap.registerPlugin(ScrollTrigger);

interface Chapter {
  title: [string, string];
  body: string;
  /** Window of overall hero scroll progress (0..1) where this chapter is on screen. */
  at: [number, number];
}

const CHAPTERS: Chapter[] = [
  {
    title: ['আমরা আছি,', 'আপনার পাশে'],
    body: '',
    at: [0.12, 0.33],
  },
  {
    title: ['শুধু তালিকা নয়,', 'সাথে সহযোগিতা'],
    body: '',
    at: [0.36, 0.56],
  },
  {
    title: ['প্রতারণা থেকে দূরে থাকুন', 'নিশ্চিন্তে এগিয়ে চলুন'],
    body: '',
    at: [0.59, 0.78],
  },
  {
    title: ['খুঁজুন, যাচাই করুন', 'তারপর সিদ্ধান্ত নিন'],
    body: '',
    at: [0.81, 1],
  },
];

/** Quantized scroll progress stops: Intro (0) + each chapter phase (ending at 1). */
const PHASE_SNAP_POINTS: number[] = [
  0,
  ...CHAPTERS.map(({ at: [s, e] }, i) => (i === CHAPTERS.length - 1 ? 1 : Number(((s + e) / 2).toFixed(4)))),
];

interface CinematicHeroProps {
  images: React.MutableRefObject<HTMLImageElement[]>;
  ready: boolean;
  onExplore: () => void;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, alpha: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.globalAlpha = 1;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ images, ready, onExplore }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const introTitleRef = useRef<HTMLHeadingElement>(null);
  const introSubRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railFillRef = useRef<HTMLDivElement>(null);

  const frameState = useRef({ frame: 0 });
  const lastDrawn = useRef(-1);
  const wasReadyOnMount = useRef(ready);

  /** Paints the current (fractional) frame, cross-fading neighbours for buttery motion. */
  const render = (force = false) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const imgs = images.current;
    if (!canvas || !ctx || !imgs.length) return;

    const f = Math.min(FRAME_COUNT - 1, Math.max(0, frameState.current.frame));
    if (!force && Math.abs(f - lastDrawn.current) < 0.001) return;

    const i = Math.floor(f);
    const t = f - i;
    const a = imgs[i];
    const b = imgs[Math.min(i + 1, imgs.length - 1)];
    if (!a || !a.complete || !a.naturalWidth) return;

    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawCover(ctx, a, canvas.width, canvas.height, 1);
    if (t > 0.005 && b && b !== a && b.complete && b.naturalWidth) {
      drawCover(ctx, b, canvas.width, canvas.height, t);
    }
    lastDrawn.current = f;
  };

  // Canvas sizing (DPR-aware, capped at 2x for performance)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext('2d', { alpha: false });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      if (ctxRef.current) {
        ctxRef.current.imageSmoothingEnabled = true;
        ctxRef.current.imageSmoothingQuality = 'high';
      }
      render(true);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll-driven master timeline
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      if (wasReadyOnMount.current) {
        gsap.set(section.querySelectorAll('[data-intro-line]'), { yPercent: 0 });
        gsap.set(section.querySelectorAll('[data-intro-fade]'), { autoAlpha: 1, y: 0 });
        gsap.set(canvasRef.current, { autoAlpha: 1 });
      } else {
        // Hidden until the preloader hands off
        gsap.set(section.querySelectorAll('[data-intro-line]'), { yPercent: 115 });
        gsap.set(section.querySelectorAll('[data-intro-fade]'), { autoAlpha: 0, y: 24 });
        gsap.set(canvasRef.current, { autoAlpha: 0 });
      }

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * (window.innerWidth < 768 ? 1.25 : 1.6))}`,
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          refreshPriority: 1,
          snap: {
            snapTo: (value, self) => {
              const threshold = 0.005;
              const dir = self?.direction ?? 0;
              if (dir > 0) {
                for (let i = 0; i < PHASE_SNAP_POINTS.length; i++) {
                  if (PHASE_SNAP_POINTS[i] >= value - threshold) {
                    return PHASE_SNAP_POINTS[i];
                  }
                }
                return PHASE_SNAP_POINTS[PHASE_SNAP_POINTS.length - 1];
              }
              if (dir < 0) {
                for (let i = PHASE_SNAP_POINTS.length - 1; i >= 0; i--) {
                  if (PHASE_SNAP_POINTS[i] <= value + threshold) {
                    return PHASE_SNAP_POINTS[i];
                  }
                }
                return PHASE_SNAP_POINTS[0];
              }
              return gsap.utils.snap(PHASE_SNAP_POINTS, value);
            },
            inertia: false,
            duration: { min: 0.25, max: 0.55 },
            delay: 0.05,
            ease: 'power2.inOut',
          },
          onUpdate: (self) => {
            if (railFillRef.current) railFillRef.current.style.transform = `scaleY(${self.progress})`;
          },
        },
      });

      // 1. Frame sequence (finishes slightly early so the final shot can breathe)
      tl.fromTo(
        frameState.current,
        { frame: 0 },
        { frame: FRAME_COUNT - 1, duration: 0.9, onUpdate: () => render() },
        0
      );

      // 2. Subtle camera push-out for depth
      tl.fromTo(stageRef.current, { scale: 1.08 }, { scale: 1, duration: 1 }, 0);

      // 3. Intro exits with crisp parallax
      tl.fromTo(introTitleRef.current, { yPercent: 0 }, { yPercent: -40, duration: 0.12 }, 0)
        .fromTo(introSubRef.current, { y: 0 }, { y: -30, duration: 0.12 }, 0)
        .fromTo(introRef.current, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08 }, 0.02);

      // 4. Blueprint grid dissolves as materials arrive
      tl.fromTo(gridRef.current, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 1.08, duration: 0.22 }, 0.28);

      // 5. Chapters: gentle depth layers drifting cleanly
      chapterRefs.current.forEach((el, i) => {
        if (!el) return;
        const [s, e] = CHAPTERS[i].at;
        const span = e - s;
        const isLast = i === CHAPTERS.length - 1;
        const title = el.querySelector('[data-ch-title]');
        const body = el.querySelector('[data-ch-body]');

        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, s);
        if (isLast) {
          tl.fromTo(title, { y: 50 }, { y: 0, duration: 0.09, ease: 'power2.out' }, s);
          if (body) tl.fromTo(body, { y: 35 }, { y: 0, duration: 0.1, ease: 'power2.out' }, s);
        } else {
          tl.fromTo(title, { y: 50 }, { y: -25, duration: span }, s);
          if (body) tl.fromTo(body, { y: 30 }, { y: -10, duration: span }, s);
          tl.to(el, { autoAlpha: 0, duration: 0.035 }, e - 0.035);
        }
      });
    }, section);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intro choreography once frames are decoded
  useEffect(() => {
    if (!ready || !sectionRef.current) return;
    render(true);
    if (wasReadyOnMount.current) {
      ScrollTrigger.refresh();
      return;
    }
    const section = sectionRef.current;
    const tl = gsap.timeline();
    tl.to(canvasRef.current, { autoAlpha: 1, duration: 1.6, ease: 'power2.out' }, 0)
      .to(section.querySelectorAll('[data-intro-line]'), { yPercent: 0, duration: 1.5, stagger: 0.12, ease: 'expo.out' }, 0.15)
      .to(section.querySelectorAll('[data-intro-fade]'), { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' }, 0.55);
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
      className="relative h-screen w-full overflow-hidden bg-[#070b14] text-[#f4efe6]"
    >
      {/* Layer 0: frame sequence */}
      <div ref={stageRef} className="absolute inset-0 will-change-transform">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      </div>

      {/* Layer 1: atmosphere */}
      <div ref={gridRef} className="hero-grid" aria-hidden="true" />
      <div className="hero-shade-left" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {/* Layer 2: intro */}
      <div
        ref={introRef}
        className="absolute inset-0 z-20 flex flex-col justify-end px-6 md:px-12 lg:px-20 pb-16 sm:pb-20 md:pb-[15vh] lg:pb-[14vh]"
      >
        <h1
          ref={introTitleRef}
          className="font-display font-light text-[8.5vw] sm:text-[6.5vw] lg:text-[5vw] xl:text-[4.4vw] leading-[1.3] tracking-[-0.01em] max-w-[20ch]"
        >
          <span className="reveal-line">
            <span data-intro-line>রাজশাহীতে</span>
          </span>
          <span className="reveal-line">
            <span data-intro-line>খুঁজছেন</span>
          </span>
          <span className="reveal-line">
            <span data-intro-line>
              মনের মতো <em className="italic text-gradient-gold pr-[0.06em]">ঠিকানা?</em>
            </span>
          </span>
        </h1>
        <div ref={introSubRef} className="mt-8 md:mt-12 flex flex-col items-start gap-6 sm:gap-7 max-w-sm sm:max-w-[400px]">
          <div data-intro-fade className="flex items-center">
            <button id="hero-explore-btn" onClick={onExplore} className="btn-gold">
              Explore Residences <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Layer 3: chapters */}
      {CHAPTERS.map((c, i) => {
        const isLast = i === CHAPTERS.length - 1;
        return (
          <div
            key={i}
            ref={(el) => {
              chapterRefs.current[i] = el;
            }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center px-6 md:px-12 lg:px-20 pt-20 pb-16"
          >
            <div className="relative max-w-2xl">
              <div data-ch-title>
                <h2 className="font-display font-light text-5xl sm:text-6xl lg:text-7xl leading-[1.35] tracking-[-0.01em]">
                  <span className="inline-block py-[0.08em]">{c.title[0]}</span>
                  <br />
                  <em className="italic text-gradient-gold inline-block py-[0.12em] pr-[0.12em]">{c.title[1]}</em>
                </h2>
              </div>
              {(c.body || isLast) && (
                <div data-ch-body className="mt-7">
                  {c.body && (
                    <p className="text-[17px] sm:text-lg lg:text-xl leading-[1.75] text-slate-200 font-normal max-w-lg">{c.body}</p>
                  )}
                  {isLast && (
                    <div className="pointer-events-auto mt-9 flex flex-wrap gap-3">
                      <button id="hero-final-explore-btn" onClick={onExplore} className="btn-gold">
                        View the Collection <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Layer 4: progress rail */}
      <aside
        aria-hidden="true"
        className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 z-30 hidden md:block"
      >
        <div className="relative w-px h-[38vh] bg-white/10">
          <div
            ref={railFillRef}
            className="absolute inset-0 origin-top bg-gradient-to-b from-[#8fc3ff] via-[#d1ad7a] to-[#f1dfbd]"
            style={{ transform: 'scaleY(0)' }}
          />
        </div>
      </aside>
    </section>
  );
};
