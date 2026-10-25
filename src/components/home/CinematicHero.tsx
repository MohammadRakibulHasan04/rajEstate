import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Compass } from 'lucide-react';
import { FRAME_COUNT } from '../../lib/frames';

gsap.registerPlugin(ScrollTrigger);

interface Chapter {
  no: string;
  kicker: string;
  title: [string, string];
  body: string;
  meta: { label: string; value: string }[];
  /** Window of overall hero scroll progress (0..1) where this chapter is on screen. */
  at: [number, number];
}

const CHAPTERS: Chapter[] = [
  {
    no: '01',
    kicker: 'The Blueprint',
    title: ['প্রতিটি রেখায়,', 'সুনির্দিষ্ট উদ্দেশ্য।'],
    body: 'কাগজে শুরু হয় সব: সূর্যের আলো আর জায়গার মাপ অনুযায়ী নকশা, যা নিখুঁত না হওয়া পর্যন্ত চলতে থাকে।',
    meta: [
      { label: 'Drafting scale', value: '1:50' },
      { label: 'Site datum', value: '+142.50 m' },
    ],
    at: [0.1, 0.31],
  },
  {
    no: '02',
    kicker: 'The Foundation',
    title: ['গভীরে নিহিত,', 'নিঃশব্দ নির্ভুলতা।'],
    body: 'নকশা থেকে উঠে আসে মজবুত কংক্রিট আর বিশাল কাচের দেয়াল, যার প্রতিটি মিলিমিটার মাপা।',
    meta: [
      { label: 'Structure', value: 'C50 Concrete' },
      { label: 'Glazing', value: 'Low-iron, triple' },
    ],
    at: [0.34, 0.53],
  },
  {
    no: '03',
    kicker: 'The Material',
    title: ['কাঠ, পাথর', 'এবং প্রাকৃতিক আলো।'],
    body: 'সিডার কাঠ, অখণ্ড দেয়াল আর ফ্রেমহীন কাচ—সবকিছু সাজানো হয়েছে এমনভাবে, যা সময়ের সাথে আরও সুন্দর হয়ে ওঠে।',
    meta: [
      { label: 'Cladding', value: 'Western red cedar' },
      { label: 'Envelope', value: 'Passivhaus' },
    ],
    at: [0.56, 0.76],
  },
  {
    no: '04',
    kicker: 'The Residence',
    title: ['একটি বাড়ি,', 'অবশেষে বাস্তব।'],
    body: 'অলিভ বাগান, অনন্ত সীমানা আর দিনের শেষ আলো। এখানেই স্থাপত্য হয়ে ওঠে জীবনযাপনের এক অনন্য উপায়।',
    meta: [
      { label: 'Living area', value: '6,450 sq ft' },
      { label: 'Certification', value: 'LEED Platinum' },
    ],
    at: [0.8, 1],
  },
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
  const cueRef = useRef<HTMLDivElement>(null);

  const frameState = useRef({ frame: 0 });
  const lastDrawn = useRef(-1);
  const activeRef = useRef(-1);
  const [active, setActive] = useState(-1);

  /** Paints the current (fractional) frame, cross-fading neighbours for buttery motion. */
  const render = (force = false) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const imgs = images.current;
    if (!canvas || !ctx || !imgs.length) return;

    const f = Math.min(FRAME_COUNT - 1, Math.max(0, frameState.current.frame));
    if (!force && Math.abs(f - lastDrawn.current) < 0.002) return;

    const i = Math.floor(f);
    const t = f - i;
    const a = imgs[i];
    const b = imgs[Math.min(i + 1, imgs.length - 1)];
    if (!a || !a.complete || !a.naturalWidth) return;

    drawCover(ctx, a, canvas.width, canvas.height, 1);
    if (t > 0.01 && b && b !== a && b.complete && b.naturalWidth) {
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
      // Hidden until the preloader hands off
      gsap.set(section.querySelectorAll('[data-intro-line]'), { yPercent: 115 });
      gsap.set(section.querySelectorAll('[data-intro-fade]'), { autoAlpha: 0, y: 24 });
      gsap.set(canvasRef.current, { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerHeight * 4.5}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          refreshPriority: 1,
          onUpdate: (self) => {
            if (railFillRef.current) railFillRef.current.style.transform = `scaleY(${self.progress})`;
            const p = self.progress;
            let idx = -1;
            CHAPTERS.forEach((c, i) => {
              if (p >= c.at[0] - 0.02) idx = i;
            });
            if (idx !== activeRef.current) {
              activeRef.current = idx;
              setActive(idx);
            }
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

      // 2. Slow camera push-out for depth
      tl.fromTo(stageRef.current, { scale: 1.14 }, { scale: 1, duration: 1 }, 0);

      // 3. Intro exits with layered parallax (title outruns the copy)
      tl.fromTo(introTitleRef.current, { yPercent: 0 }, { yPercent: -55, duration: 0.14 }, 0)
        .fromTo(introSubRef.current, { y: 0 }, { y: -40, duration: 0.14 }, 0)
        .fromTo(introRef.current, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08 }, 0.035)
        .fromTo(cueRef.current, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.05 }, 0.02);

      // 4. Blueprint grid dissolves as materials arrive
      tl.fromTo(gridRef.current, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 1.12, duration: 0.25 }, 0.38);

      // 5. Chapters: three depth layers drifting at different speeds
      chapterRefs.current.forEach((el, i) => {
        if (!el) return;
        const [s, e] = CHAPTERS[i].at;
        const span = e - s;
        const isLast = i === CHAPTERS.length - 1;
        const num = el.querySelector('[data-ch-num]');
        const title = el.querySelector('[data-ch-title]');
        const body = el.querySelector('[data-ch-body]');

        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, s);
        if (isLast) {
          tl.fromTo(title, { y: 70 }, { y: 0, duration: 0.12, ease: 'power2.out' }, s)
            .fromTo(body, { y: 50 }, { y: 0, duration: 0.14, ease: 'power2.out' }, s)
            .fromTo(num, { y: 140 }, { y: 0, duration: 0.16, ease: 'power2.out' }, s);
        } else {
          tl.fromTo(title, { y: 80 }, { y: -40, duration: span }, s)
            .fromTo(body, { y: 50 }, { y: -12, duration: span }, s)
            .fromTo(num, { y: 180 }, { y: -160, duration: span }, s)
            .to(el, { autoAlpha: 0, duration: 0.04 }, e - 0.04);
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
        className="absolute inset-0 z-20 flex flex-col justify-end px-6 md:px-12 lg:px-20 pb-28 md:pb-[13vh]"
      >
        <div className="eyebrow mb-7" data-intro-fade>
          Architectural Residences · Collection 2026
        </div>
        <h1
          ref={introTitleRef}
          className="font-display font-light text-[13vw] sm:text-[10vw] lg:text-[8.2vw] leading-[0.92] tracking-[-0.02em] max-w-[14ch]"
        >
          <span className="reveal-line">
            <span data-intro-line>যেখানে কল্পনা</span>
          </span>
          <span className="reveal-line">
            <span data-intro-line>
              হয়ে ওঠে <em className="italic text-gradient-gold pr-[0.06em]">বাড়ি।</em>
            </span>
          </span>
        </h1>
        <div ref={introSubRef} className="mt-8 flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-16">
          <p data-intro-fade className="max-w-md text-[15px] leading-relaxed text-slate-300/90 font-light">
            আমরা স্থপতিদের নকশা করা সেরা বাড়িগুলো নির্বাচন করি এবং একটি সাধারণ রেখা থেকে শুরু করে পূর্ণাঙ্গ রূপ পাওয়া পর্যন্ত প্রতিটি স্থাপত্যের গল্প বলি।
          </p>
          <div data-intro-fade className="flex flex-wrap items-center gap-3">
            <button id="hero-explore-btn" onClick={onExplore} className="btn-gold">
              Explore Residences <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Layer 3: chapters */}
      {CHAPTERS.map((c, i) => (
        <div
          key={c.no}
          ref={(el) => {
            chapterRefs.current[i] = el;
          }}
          className="pointer-events-none absolute inset-0 z-20 flex items-end px-6 md:px-12 lg:px-20 pb-28 md:pb-[14vh]"
        >
          <span
            data-ch-num
            aria-hidden="true"
            className="text-outline font-display font-light absolute right-[8vw] bottom-[8vh] hidden md:block text-[28vw] lg:text-[22vw] leading-none select-none"
          >
            {c.no}
          </span>

          <div className="relative max-w-xl">
            <div data-ch-title>
              <div className="eyebrow mb-6">
                Chapter {c.no} — {c.kicker}
              </div>
              <h2 className="font-display font-light text-5xl sm:text-6xl lg:text-7xl leading-[0.98] tracking-[-0.02em]">
                {c.title[0]}
                <br />
                <em className="italic text-gradient-gold">{c.title[1]}</em>
              </h2>
            </div>
            <div data-ch-body className="mt-7">
              <p className="text-[15px] leading-relaxed text-slate-300/90 font-light max-w-md">{c.body}</p>
              <dl className="mt-7 flex gap-10 border-t border-white/10 pt-5">
                {c.meta.map((m) => (
                  <div key={m.label}>
                    <dt className="text-[10px] font-mono tracking-[0.28em] uppercase text-slate-500">{m.label}</dt>
                    <dd className="mt-1.5 font-display text-xl text-[#f4efe6]">{m.value}</dd>
                  </div>
                ))}
              </dl>
              {i === CHAPTERS.length - 1 && (
                <div className="pointer-events-auto mt-9 flex flex-wrap gap-3">
                  <button id="hero-final-explore-btn" onClick={onExplore} className="btn-gold">
                    View the Collection <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Layer 4: progress rail */}
      <aside
        aria-hidden="true"
        className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-stretch gap-5"
      >
        <ol className="flex flex-col justify-between py-1 text-right">
          {CHAPTERS.map((c, i) => (
            <li
              key={c.no}
              className={`font-mono text-[10px] tracking-[0.28em] uppercase transition-all duration-700 ${
                active === i ? 'text-[#d1ad7a] translate-x-0' : 'text-slate-500/70 translate-x-1'
              }`}
            >
              <span className="mr-3 opacity-60">{c.no}</span>
              <span className={`inline-block transition-all duration-700 ${active === i ? 'opacity-100' : 'opacity-0 lg:opacity-60'}`}>
                {c.kicker.replace('The ', '')}
              </span>
            </li>
          ))}
        </ol>
        <div className="relative w-px h-[38vh] bg-white/10">
          <div
            ref={railFillRef}
            className="absolute inset-0 origin-top bg-gradient-to-b from-[#8fc3ff] via-[#d1ad7a] to-[#f1dfbd]"
            style={{ transform: 'scaleY(0)' }}
          />
        </div>
      </aside>

      {/* Layer 5: footer meta */}
      <div className="absolute bottom-0 inset-x-0 z-30 flex items-end justify-between px-6 md:px-12 lg:px-20 pb-7 text-[10px] font-mono tracking-[0.3em] uppercase text-slate-400">
        <div ref={cueRef}>
          <div className="flex items-center gap-4" data-intro-fade>
            <div className="scroll-cue" />
            <span>Scroll to build</span>
          </div>
        </div>
      </div>
    </section>
  );
};
