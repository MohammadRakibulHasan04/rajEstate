import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Compass, KeyRound, ShieldCheck, TrendingUp } from 'lucide-react';
import bgImg from '../../assets/hero-images/bg.png';
import fgImg from '../../assets/hero-images/fg.png';

gsap.registerPlugin(ScrollTrigger);

export interface CinematicHeroProps {
  images?: React.MutableRefObject<HTMLImageElement[]>;
  ready?: boolean;
  onExplore: () => void;
}

const HERO_FLOATING_CARDS = [
  {
    title: 'Buy',
    tag: 'Verified Homes',
    Icon: KeyRound,
    positionClass:
      'left-4 sm:left-8 md:left-12 lg:left-16 top-[46%] sm:top-[47%] md:top-[46%]',
    parallaxY: -95,
    depthFactor: 1.15,
  },
  {
    title: 'Sell',
    tag: 'Private Advisory',
    Icon: TrendingUp,
    positionClass:
      'left-6 sm:left-14 md:left-20 lg:left-28 bottom-[13%] sm:bottom-[15%] md:bottom-[14%]',
    parallaxY: -70,
    depthFactor: 0.85,
  },
  {
    title: 'Find',
    tag: 'Prime Addresses',
    Icon: Compass,
    positionClass:
      'right-4 sm:right-8 md:right-12 lg:right-16 top-[44%] sm:top-[45%] md:top-[44%]',
    parallaxY: -105,
    depthFactor: 1.25,
  },
  {
    title: 'Deliver',
    tag: 'Turnkey Reality',
    Icon: ShieldCheck,
    positionClass:
      'right-6 sm:right-14 md:right-20 lg:right-28 bottom-[12%] sm:bottom-[14%] md:bottom-[13%]',
    parallaxY: -78,
    depthFactor: 0.95,
  },
] as const;

export const CinematicHero: React.FC<CinematicHeroProps> = ({
  ready = true,
  onExplore,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const bgImgRef = useRef<HTMLImageElement>(null);
  const titlePrimaryWrapRef = useRef<HTMLDivElement>(null);
  const titlePrimaryTextRef = useRef<HTMLSpanElement>(null);
  const titleSecondaryWrapRef = useRef<HTMLDivElement>(null);
  const titleSecondaryTextRef = useRef<HTMLSpanElement>(null);
  const fgLayerRef = useRef<HTMLDivElement>(null);
  const fgImgRef = useRef<HTMLImageElement>(null);
  const cardScrollRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardFloatRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  const hasEnteredRef = useRef(false);

  // Subtle interactive pointer depth parallax + ambient floating levitation
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const floatTweens: gsap.core.Tween[] = [];

    if (!reducedMotion) {
      cardFloatRefs.current.forEach((el, idx) => {
        if (!el) return;
        floatTweens.push(
          gsap.to(el, {
            y: idx % 2 === 0 ? -7 : 7,
            duration: 2.6 + idx * 0.35,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: idx * 0.25,
          })
        );
      });
    }

    const mq = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!mq.matches) {
      return () => {
        floatTweens.forEach((t) => t.kill());
      };
    }

    const xBgTo = bgImgRef.current
      ? gsap.quickTo(bgImgRef.current, 'x', { duration: 1.1, ease: 'power3.out' })
      : null;
    const yBgTo = bgImgRef.current
      ? gsap.quickTo(bgImgRef.current, 'y', { duration: 1.1, ease: 'power3.out' })
      : null;

    const xPrimaryTo = titlePrimaryTextRef.current
      ? gsap.quickTo(titlePrimaryTextRef.current, 'x', { duration: 0.9, ease: 'power3.out' })
      : null;

    const xSecondaryTo = titleSecondaryTextRef.current
      ? gsap.quickTo(titleSecondaryTextRef.current, 'x', { duration: 0.85, ease: 'power3.out' })
      : null;

    const xFgTo = fgImgRef.current
      ? gsap.quickTo(fgImgRef.current, 'x', { duration: 0.75, ease: 'power3.out' })
      : null;

    const cardQuickX = cardFloatRefs.current.map((el, i) =>
      el
        ? gsap.quickTo(el, 'x', {
            duration: 0.65 + i * 0.06,
            ease: 'power3.out',
          })
        : null
    );

    const onPointerMove = (e: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;

      xBgTo?.(-nx * 10);
      yBgTo?.(-ny * 8);
      xPrimaryTo?.(-nx * 18);
      xSecondaryTo?.(-nx * 13);
      xFgTo?.(nx * 10);
      cardQuickX.forEach((qx, i) => {
        qx?.(nx * 16 * HERO_FLOATING_CARDS[i].depthFactor);
      });
    };

    const onPointerLeave = () => {
      xBgTo?.(0);
      yBgTo?.(0);
      xPrimaryTo?.(0);
      xSecondaryTo?.(0);
      xFgTo?.(0);
      cardQuickX.forEach((qx) => qx?.(0));
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    section.addEventListener('pointerleave', onPointerLeave, { passive: true });
    return () => {
      floatTweens.forEach((t) => t.kill());
      window.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  // GSAP ScrollTrigger multi-plane depth parallax choreography
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.set(bgLayerRef.current, { scale: 1.08, yPercent: 0, force3D: true });
      gsap.set(titlePrimaryWrapRef.current, { yPercent: 0, scale: 1, force3D: true });
      gsap.set(titleSecondaryWrapRef.current, { yPercent: 0, scale: 1, force3D: true });
      gsap.set(fgLayerRef.current, { yPercent: 14, scale: 1, force3D: true });

      const tl = gsap.timeline({
        defaults: { ease: 'none', force3D: true },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=145%',
          pin: true,
          scrub: 0.65,
          anticipatePin: 1,
          refreshPriority: 1,
          invalidateOnRefresh: true,
        },
      });

      // Layer 0: Background sky subtle push-back and downward horizon drift
      tl.fromTo(
        bgLayerRef.current,
        { scale: 1.08, yPercent: 0 },
        { scale: 1.0, yPercent: 9, duration: 1 },
        0
      );

      // Layer 1A: 'Jonopod' in white ITC Bauhaus parallaxes DOWNWARD behind the transparent PNG building
      tl.fromTo(
        titlePrimaryWrapRef.current,
        { yPercent: 0, scale: 1, opacity: 1 },
        { yPercent: 95, scale: 0.91, opacity: 0.9, duration: 1 },
        0
      );

      // Layer 1B: 'Properties' in white ITC Bauhaus parallaxes DOWNWARD behind the building
      tl.fromTo(
        titleSecondaryWrapRef.current,
        { yPercent: 0, scale: 1, opacity: 1 },
        { yPercent: 112, scale: 0.89, opacity: 0.82, duration: 1 },
        0
      );

      // Layer 2: Foreground transparent PNG building rises UPWARD and scales forward in front of 'Jonopod Properties'
      tl.fromTo(
        fgLayerRef.current,
        { yPercent: 14, scale: 1 },
        { yPercent: -3, scale: 1.085, duration: 1 },
        0
      );

      // Layer 3: 4 compact floating glass cards (in front, z-30) parallax with ScrollTrigger
      cardScrollRefs.current.forEach((cardWrap, idx) => {
        if (!cardWrap) return;
        const cfg = HERO_FLOATING_CARDS[idx];
        tl.fromTo(
          cardWrap,
          { y: 0, scale: 1, autoAlpha: 1 },
          {
            y: cfg.parallaxY,
            scale: 0.92,
            autoAlpha: 0,
            duration: 0.72,
            ease: 'power1.inOut',
          },
          idx * 0.04
        );
      });

      if (bottomBarRef.current) {
        tl.fromTo(
          bottomBarRef.current,
          { y: 0, autoAlpha: 1 },
          { y: 24, autoAlpha: 0, duration: 0.45 },
          0
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  // Entrance reveal once preloader completes
  useEffect(() => {
    if (!ready || hasEnteredRef.current || !sectionRef.current) return;
    hasEnteredRef.current = true;

    const ctx = gsap.context(() => {
      const cards = cardFloatRefs.current.filter(Boolean);
      const tl = gsap.timeline({ defaults: { ease: 'expo.out', force3D: true } });

      tl.fromTo(
        titlePrimaryTextRef.current,
        { yPercent: 32, scale: 0.94, autoAlpha: 0 },
        { yPercent: 0, scale: 1, autoAlpha: 1, duration: 1.45 },
        0.1
      )
        .fromTo(
          titleSecondaryTextRef.current,
          { yPercent: 38, scale: 0.94, autoAlpha: 0 },
          { yPercent: 0, scale: 1, autoAlpha: 1, duration: 1.45 },
          0.2
        )
        .fromTo(
          fgImgRef.current,
          { yPercent: 8, scale: 0.97, autoAlpha: 0 },
          { yPercent: 0, scale: 1, autoAlpha: 1, duration: 1.55 },
          0.05
        )
        .fromTo(
          cards,
          { y: 26, scale: 0.9, autoAlpha: 0 },
          { y: 0, scale: 1, autoAlpha: 1, duration: 1.15, stagger: 0.08 },
          0.36
        )
        .fromTo(
          bottomBarRef.current,
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1.1 },
          0.48
        );
    }, sectionRef.current);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [ready]);

  return (
    <section
      id="home"
      ref={sectionRef}
      aria-label="Jonopod Properties"
      className="relative h-screen h-[100dvh] w-full overflow-hidden bg-[#1e78e8] select-none"
    >
      {/* =====================================================================
          LAYER 0 (z-0): SKY BACKGROUND IMAGE (src/assets/hero-images/bg.png)
      ====================================================================== */}
      <div
        ref={bgLayerRef}
        data-hero-bg
        className="pointer-events-none absolute inset-0 z-0 will-change-transform"
      >
        <img
          ref={bgImgRef}
          src={bgImg}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-[1.04] object-cover object-center will-change-transform"
          draggable={false}
        />
      </div>

      {/* =====================================================================
          LAYER 1 (z-10): WHITE 'Jonopod' + 'Properties' IN ITC BAUHAUS
          Generous top blank sky space below the navbar, strictly BEHIND fg.png
      ====================================================================== */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center pt-[15.5vh] sm:pt-[16.5vh] md:pt-[17.5vh] px-4">
        <h1 className="w-full flex flex-col items-center text-center">
          <div
            ref={titlePrimaryWrapRef}
            data-hero-title-primary
            className="w-full flex justify-center will-change-transform"
          >
            <span
              ref={titlePrimaryTextRef}
              style={{ fontFamily: "'ITC Bauhaus', 'itc bauhaus', 'itc bauhuas', sans-serif" }}
              className="block font-bauhaus font-bold text-white text-[17vw] sm:text-[16.2vw] md:text-[15.2vw] lg:text-[14.4vw] leading-[0.82] tracking-[-0.015em] whitespace-nowrap drop-shadow-[0_8px_30px_rgba(8,38,94,0.28)] will-change-transform"
            >
              Jonopod
            </span>
          </div>

          <div
            ref={titleSecondaryWrapRef}
            data-hero-title-secondary
            className="w-full flex justify-center mt-1 sm:mt-1.5 md:mt-2 will-change-transform"
          >
            <span
              ref={titleSecondaryTextRef}
              style={{ fontFamily: "'ITC Bauhaus', 'itc bauhaus', 'itc bauhuas', sans-serif" }}
              className="block font-bauhaus font-bold text-white text-[11.8vw] sm:text-[11.2vw] md:text-[10.4vw] lg:text-[9.8vw] leading-[0.86] tracking-[0.015em] whitespace-nowrap drop-shadow-[0_8px_28px_rgba(8,38,94,0.28)] will-change-transform"
            >
              Properties
            </span>
          </div>
        </h1>
      </div>

      {/* =====================================================================
          LAYER 2 (z-20): FOREGROUND TRANSPARENT PNG (src/assets/hero-images/fg.png)
          Renders in front of 'Jonopod' & 'Properties' so the building overlaps the text
      ====================================================================== */}
      <div
        ref={fgLayerRef}
        data-hero-fg
        className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center will-change-transform"
      >
        <img
          ref={fgImgRef}
          src={fgImg}
          alt="Jonopod luxury architectural residence"
          onLoad={() => ScrollTrigger.refresh()}
          className="h-full w-full object-cover object-bottom will-change-transform drop-shadow-[0_-10px_35px_rgba(15,23,42,0.22)]"
          draggable={false}
        />
        {/* Subtle bottom vignette for seamless grounding */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0f1c0b]/35 via-transparent to-transparent"
        />
      </div>

      {/* =====================================================================
          LAYER 3 (z-30): 4 COMPACT FLOATING GLASS CARDS (Buy, Sell, Find, Deliver)
          Positioned IN FRONT (not behind the building), floating with ScrollTrigger
      ====================================================================== */}
      <div className="pointer-events-none absolute inset-0 z-30 mx-auto max-w-[92rem]">
        {HERO_FLOATING_CARDS.map(({ title, tag, Icon, positionClass }, idx) => (
          <div
            key={title}
            ref={(el) => {
              cardScrollRefs.current[idx] = el;
            }}
            className={`absolute ${positionClass} will-change-transform`}
          >
            <button
              ref={(el) => {
                cardFloatRefs.current[idx] = el;
              }}
              type="button"
              onClick={onExplore}
              className="pointer-events-auto group flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-white/22 hover:bg-white/34 backdrop-blur-xl border border-white/50 hover:border-white/80 px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-[0_14px_34px_-8px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.65)] transition-colors duration-300 cursor-pointer will-change-transform"
            >
              <span className="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-white/30 border border-white/55 text-white shadow-xs">
                <Icon className="h-4 w-4 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)]" />
              </span>

              <div className="text-left pr-1">
                <div className="flex items-center gap-1">
                  <span className="font-sans text-xs sm:text-sm font-semibold tracking-tight text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.3)]">
                    {title}
                  </span>
                  <ArrowUpRight className="h-3 w-3 text-white/85 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <span className="block font-mono text-[9px] sm:text-[10px] tracking-[0.12em] uppercase text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)]">
                  {tag}
                </span>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Bottom center scroll indicator */}
      <div
        ref={bottomBarRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-30 hidden md:flex flex-col items-center gap-1.5 text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
      >
        <span className="font-mono text-[9px] tracking-[0.28em] uppercase">Scroll to Parallax</span>
        <div className="h-7 w-px bg-white/40 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-white animate-pulse" />
        </div>
      </div>
    </section>
  );
};
