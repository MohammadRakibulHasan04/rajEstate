import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Compass, KeyRound, ShieldCheck, TrendingUp } from 'lucide-react';
import bgImg from '../../assets/hero-images/bg.webp';
import fgImg from '../../assets/hero-images/fg.webp';

gsap.registerPlugin(ScrollTrigger);

export interface CinematicHeroProps {
  images?: React.MutableRefObject<HTMLImageElement[]>;
  ready?: boolean;
  onExplore: () => void;
}

const HERO_TAGLINE_WORDS = ['রাজশাহীতে', 'প্রপার্টি', 'খোঁজা', 'হোক', 'আরও', 'সহজ!'] as const;

const HERO_CARDS = [
  {
    title: 'Buy',
    Icon: KeyRound,
  },
  {
    title: 'Sell',
    Icon: TrendingUp,
  },
  {
    title: 'Find',
    Icon: Compass,
  },
  {
    title: 'Deliver',
    Icon: ShieldCheck,
  },
] as const;

export const CinematicHero: React.FC<CinematicHeroProps> = ({
  ready = true,
  onExplore,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const bgImgRef = useRef<HTMLImageElement>(null);
  const taglineWrapRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const taglineWordWrapRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const taglineWordBaseRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const taglineWordFillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const titlePrimaryWrapRef = useRef<HTMLDivElement>(null);
  const titlePrimaryTextRef = useRef<HTMLSpanElement>(null);
  const titleSecondaryWrapRef = useRef<HTMLDivElement>(null);
  const titleSecondaryTextRef = useRef<HTMLSpanElement>(null);
  const fgLayerRef = useRef<HTMLDivElement>(null);
  const fgImgRef = useRef<HTMLImageElement>(null);
  const bottomDockRef = useRef<HTMLDivElement>(null);

  const hasEnteredRef = useRef(false);

  // Subtle interactive pointer depth parallax
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mq = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!mq.matches) return;

    const xBgTo = bgImgRef.current
      ? gsap.quickTo(bgImgRef.current, 'x', { duration: 0.55, ease: 'power2.out' })
      : null;
    const yBgTo = bgImgRef.current
      ? gsap.quickTo(bgImgRef.current, 'y', { duration: 0.55, ease: 'power2.out' })
      : null;

    const xTaglineTo = taglineRef.current
      ? gsap.quickTo(taglineRef.current, 'x', { duration: 0.5, ease: 'power2.out' })
      : null;

    const xPrimaryTo = titlePrimaryTextRef.current
      ? gsap.quickTo(titlePrimaryTextRef.current, 'x', { duration: 0.5, ease: 'power2.out' })
      : null;

    const xSecondaryTo = titleSecondaryTextRef.current
      ? gsap.quickTo(titleSecondaryTextRef.current, 'x', { duration: 0.5, ease: 'power2.out' })
      : null;

    const xFgTo = fgImgRef.current
      ? gsap.quickTo(fgImgRef.current, 'x', { duration: 0.45, ease: 'power2.out' })
      : null;

    let viewW = window.innerWidth;
    let viewH = window.innerHeight;
    const onResize = () => {
      viewW = window.innerWidth;
      viewH = window.innerHeight;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (window.scrollY > 12) return;
      const nx = (e.clientX / Math.max(1, viewW)) * 2 - 1;
      const ny = (e.clientY / Math.max(1, viewH)) * 2 - 1;

      xBgTo?.(-nx * 8);
      yBgTo?.(-ny * 6);
      xTaglineTo?.(-nx * 12);
      xPrimaryTo?.(-nx * 14);
      xSecondaryTo?.(-nx * 10);
      xFgTo?.(nx * 8);
    };

    const onPointerLeave = () => {
      xBgTo?.(0);
      yBgTo?.(0);
      xTaglineTo?.(0);
      xPrimaryTo?.(0);
      xSecondaryTo?.(0);
      xFgTo?.(0);
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    section.addEventListener('pointerleave', onPointerLeave, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  // GSAP ScrollTrigger multi-plane depth parallax choreography
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.set(bgLayerRef.current, { scale: 1.06, yPercent: 0, force3D: true });
      gsap.set(taglineWrapRef.current, { yPercent: 0, force3D: true });
      gsap.set(titlePrimaryWrapRef.current, { yPercent: 0, force3D: true });
      gsap.set(titleSecondaryWrapRef.current, { yPercent: 0, force3D: true });
      gsap.set(fgLayerRef.current, { yPercent: 12, scale: 1, force3D: true });

      const tl = gsap.timeline({
        defaults: { ease: 'none', force3D: true },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=78%',
          pin: true,
          scrub: 0.2,
          anticipatePin: 1,
          fastScrollEnd: true,
          refreshPriority: 1,
          invalidateOnRefresh: true,
        },
      });

      // Layer 0: Background sky subtle push-back and downward horizon drift
      tl.fromTo(
        bgLayerRef.current,
        { scale: 1.06, yPercent: 0 },
        { scale: 1.0, yPercent: 7, duration: 1 },
        0
      );

      // Layer 10: Tagline stays clearly visible in upper sky while highlighting & bolding left-to-right
      tl.fromTo(
        taglineWrapRef.current,
        { yPercent: 0 },
        { yPercent: 24, duration: 1 },
        0
      );

      const wordWraps = taglineWordWrapRefs.current.filter(Boolean);
      const wordBases = taglineWordBaseRefs.current.filter(Boolean);
      const wordFills = taglineWordFillRefs.current.filter(Boolean);

      if (wordBases.length > 0) {
        tl.fromTo(
          wordBases,
          { clipPath: 'inset(-25% 0% -25% 0%)' },
          {
            clipPath: 'inset(-25% 0% -25% 100%)',
            duration: 0.16,
            stagger: 0.12,
            ease: 'none',
          },
          0.02
        );
      }

      if (wordFills.length > 0) {
        tl.fromTo(
          wordFills,
          { clipPath: 'inset(-25% 100% -25% 0%)' },
          {
            clipPath: 'inset(-25% 0% -25% 0%)',
            duration: 0.16,
            stagger: 0.12,
            ease: 'none',
          },
          0.02
        );
      }

      if (wordWraps.length > 0) {
        tl.fromTo(
          wordWraps,
          { scale: 0.96, y: 2 },
          {
            scale: 1.05,
            y: -1,
            duration: 0.18,
            stagger: 0.12,
            ease: 'power1.out',
          },
          0.02
        );
      }

      // Layer 1A: 'Jonopod' in white ITC Bauhaus parallaxes DOWNWARD behind the transparent building
      tl.fromTo(
        titlePrimaryWrapRef.current,
        { yPercent: 0 },
        { yPercent: 88, duration: 1 },
        0
      );

      // Layer 1B: 'Properties' in white ITC Bauhaus parallaxes DOWNWARD behind the building
      tl.fromTo(
        titleSecondaryWrapRef.current,
        { yPercent: 0 },
        { yPercent: 104, duration: 1 },
        0
      );

      // Layer 2: Foreground transparent building rises UPWARD and scales forward in front of 'Jonopod Properties'
      tl.fromTo(
        fgLayerRef.current,
        { yPercent: 12, scale: 1 },
        { yPercent: -2, scale: 1.06, duration: 1 },
        0
      );
    }, section);

    return () => ctx.revert();
  }, []);

  // Entrance reveal once preloader completes
  useEffect(() => {
    if (!ready || hasEnteredRef.current || !sectionRef.current) return;
    hasEnteredRef.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out', force3D: true } });

      tl.fromTo(
        taglineRef.current,
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.0 },
        0.02
      )
        .fromTo(
          titlePrimaryTextRef.current,
          { yPercent: 28, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 1.1 },
          0.08
        )
        .fromTo(
          titleSecondaryTextRef.current,
          { yPercent: 32, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 1.1 },
          0.14
        )
        .fromTo(
          fgImgRef.current,
          { yPercent: 6, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 1.15 },
          0.02
        );
    }, sectionRef.current);

    return () => ctx.revert();
  }, [ready]);

  return (
    <>
      <section
        id="home"
        ref={sectionRef}
        aria-label="Jonopod Properties"
        className="relative z-10 h-screen h-[100dvh] w-full overflow-hidden bg-[#1e78e8] select-none"
      >
        {/* =====================================================================
            LAYER 0 (z-0): SKY BACKGROUND IMAGE (src/assets/hero-images/bg.webp)
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
            fetchPriority="high"
            decoding="async"
            className="h-full w-full scale-[1.04] object-cover object-center"
            draggable={false}
          />
        </div>

        {/* =====================================================================
            LAYER 1 (z-10): SCROLL-HIGHLIGHTED TAGLINE + WHITE 'Jonopod' + 'Properties'
            Strictly BEHIND fg.webp
        ====================================================================== */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center pt-[10.5vh] sm:pt-[11vh] md:pt-[11.5vh] px-4">
          <div
            ref={taglineWrapRef}
            className="mb-3 sm:mb-4 md:mb-5 flex flex-col items-center will-change-transform"
          >
            <div
              ref={taglineRef}
              aria-label="রাজশাহীতে প্রপার্টি খোঁজা হোক আরও সহজ!"
              className="inline-flex flex-wrap items-center justify-center gap-x-2.5 sm:gap-x-3.5 md:gap-x-4 gap-y-1 font-sans text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] xl:text-[2.95rem] leading-[1.28] tracking-[0.01em] text-center"
            >
              {HERO_TAGLINE_WORDS.map((word, idx) => (
                <span
                  key={word}
                  ref={(el) => {
                    taglineWordWrapRefs.current[idx] = el;
                  }}
                  className="relative inline-block will-change-transform"
                >
                  {/* Base initial black state */}
                  <span
                    ref={(el) => {
                      taglineWordBaseRefs.current[idx] = el;
                    }}
                    style={{ clipPath: 'inset(-25% 0% -25% 0%)' }}
                    className="block font-bold text-[#181512] select-none"
                  >
                    {word}
                  </span>
                  {/* Left-to-right scroll-scrubbed white fill */}
                  <span
                    ref={(el) => {
                      taglineWordFillRefs.current[idx] = el;
                    }}
                    aria-hidden="true"
                    style={{ clipPath: 'inset(-25% 100% -25% 0%)' }}
                    className="absolute inset-0 font-bold text-white [text-shadow:0_6px_26px_rgba(8,38,94,0.38)]"
                  >
                    {word}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <h1 className="w-full flex flex-col items-center text-center">
            <div
              ref={titlePrimaryWrapRef}
              data-hero-title-primary
              className="w-full flex justify-center will-change-transform"
            >
              <span
                ref={titlePrimaryTextRef}
                style={{ fontFamily: "'ITC Bauhaus', 'itc bauhaus', 'itc bauhuas', sans-serif" }}
                className="block font-bauhaus font-bold text-white text-[14.5vw] sm:text-[13.8vw] md:text-[12.8vw] lg:text-[12vw] leading-[0.82] tracking-[-0.015em] whitespace-nowrap [text-shadow:0_8px_30px_rgba(8,38,94,0.28)]"
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
                className="block font-bauhaus font-bold text-white text-[10vw] sm:text-[9.5vw] md:text-[8.8vw] lg:text-[8.2vw] leading-[0.86] tracking-[0.015em] whitespace-nowrap [text-shadow:0_8px_28px_rgba(8,38,94,0.28)]"
              >
                Properties
              </span>
            </div>
          </h1>
        </div>

        {/* =====================================================================
            LAYER 2 (z-20): FOREGROUND TRANSPARENT WEBP (src/assets/hero-images/fg.webp)
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
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-bottom"
            draggable={false}
          />
          {/* Subtle bottom vignette for seamless grounding */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0f1c0b]/35 via-transparent to-transparent"
          />
        </div>
      </section>

      {/* =====================================================================
          BRIDGE BAR (z-30): STRADDLES 50% IN HERO & 50% IN PHILOSOPHY SECTION
      ====================================================================== */}
      <div className="relative z-30 h-0 w-full select-none">
        <div className="pointer-events-none absolute inset-x-0 top-0 -translate-y-1/2 flex justify-center px-4 sm:px-6">
          <div
            ref={bottomDockRef}
            className="pointer-events-auto w-full max-w-4xl rounded-lg sm:rounded-xl bg-[#FAF9F6] border border-[#181512]/10 shadow-[0_22px_55px_-12px_rgba(15,23,42,0.28)] px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 items-center gap-y-2 md:gap-y-0 md:divide-x md:divide-[#181512]/10">
              {HERO_CARDS.map(({ title, Icon }) => (
                <button
                  key={title}
                  type="button"
                  onClick={onExplore}
                  className="group flex items-center justify-center gap-3 px-3 sm:px-5 py-2 text-center transition-colors cursor-pointer rounded-md md:rounded-none hover:bg-[#181512]/[0.03] md:hover:bg-transparent"
                >
                  <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-[#181512]/[0.06] group-hover:bg-[#181512] text-[#181512] group-hover:text-white transition-colors duration-300">
                    <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                  </span>

                  <span className="font-sans text-sm sm:text-base font-semibold tracking-tight text-[#181512] group-hover:text-[#9A6B3B] transition-colors">
                    {title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};