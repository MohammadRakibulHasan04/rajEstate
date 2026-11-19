import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowDown,
  ArrowUp,
  Compass,
  FileCheck2,
  KeyRound,
  Scale,
  ShieldCheck,
} from 'lucide-react';

import discoveryImg from '../../assets/frames/frame_030.jpg';
import floorPlanImg from '../../assets/project-1/floor-plan.jpg';
import valuationImg from '../../assets/project-1/building-design.jpg';
import structuralImg from '../../assets/frames/frame_020.jpg';
import interiorImg from '../../assets/project-1/dining.jpg';

gsap.registerPlugin(ScrollTrigger);

export interface PropertySolutionsSectionProps {
  onExplore?: () => void;
  onConsult?: () => void;
}

interface FloatingToken {
  label: string;
  sub: string;
  posClass: string;
  speed: number;
  rotate: number;
  variant: 'pill' | 'bean' | 'seal';
}

interface SolutionSlide {
  index: string;
  title: string;
  titleBn: string;
  category: string;
  description: string;
  ctaLabel: string;
  ctaAction: 'explore' | 'consult';
  leftBg: string;
  swatchColor: string;
  rimTone: string;
  image: string;
  imageCaption: string;
  metricCode: string;
  metricValue: string;
  instrumentLabel: string;
  instrumentCode: string;
  Icon: React.ComponentType<{ className?: string }>;
  tokens: FloatingToken[];
}

const SOLUTIONS: SolutionSlide[] = [
  {
    index: '01',
    title: 'Property Discovery',
    titleBn: 'সঠিক প্রপার্টি নির্বাচন ও অনুসন্ধান',
    category: 'Curated Portfolio Match',
    description:
      'Handpicked residential apartments, commercial floors, and prime plots across Rajshahi—filtered by verified sunlight orientation, ventilation, and neighborhood livability.',
    ctaLabel: 'EXPLORE RESIDENCES',
    ctaAction: 'explore',
    leftBg: '#D7C6B4',
    swatchColor: '#E3D5C5',
    rimTone: '#F7F3ED',
    image: discoveryImg,
    imageCaption: 'SOUTH-EAST ORIENTATION · 135° AZIMUTH',
    metricCode: 'RAJSHAHI · VERIFIED',
    metricValue: '100% Curated',
    instrumentLabel: 'SOLAR & SPATIAL DATUM',
    instrumentCode: 'SCALE 1:100 · S-E',
    Icon: Compass,
    tokens: [
      {
        label: 'South-East Facing',
        sub: 'Optimal Daylight',
        posClass: 'top-[13%] left-[18%]',
        speed: 1.35,
        rotate: -8,
        variant: 'pill',
      },
      {
        label: 'Prime Zones',
        sub: 'Padma R/A · Boalia',
        posClass: 'bottom-[15%] left-[20%]',
        speed: 1.5,
        rotate: 6,
        variant: 'pill',
      },
      {
        label: '3D Floor Match',
        sub: 'Spatial Audit',
        posClass: 'bottom-[18%] right-[13%]',
        speed: 1.25,
        rotate: -5,
        variant: 'seal',
      },
    ],
  },
  {
    index: '02',
    title: 'Legal Verification',
    titleBn: 'নিষ্কণ্টক দলিল ও অনুমোদন যাচাই',
    category: 'Complete Title Due Diligence',
    description:
      'Every property undergoes a 24-point legal audit covering CS/SA/RS/BS khatian chains, up-to-date mutation records, RDA sanctioned blueprints, and non-encumbrance certificates.',
    ctaLabel: 'VERIFY DOCUMENTATION',
    ctaAction: 'consult',
    leftBg: '#9BA19F',
    swatchColor: '#919896',
    rimTone: '#EFECE6',
    image: floorPlanImg,
    imageCaption: 'SANCTIONED BLUEPRINT · CAD VERIFIED',
    metricCode: 'DEED & KHATIAN',
    metricValue: '24-Pt Audited',
    instrumentLabel: 'TITLE CHAIN LEDGER',
    instrumentCode: 'CS · SA · RS · BS',
    Icon: FileCheck2,
    tokens: [
      {
        label: 'RDA Sanctioned',
        sub: 'Approved Plan',
        posClass: 'top-[14%] left-[19%]',
        speed: 1.4,
        rotate: 7,
        variant: 'pill',
      },
      {
        label: 'Mutation Clear',
        sub: 'Zero Dispute',
        posClass: 'bottom-[14%] left-[22%]',
        speed: 1.2,
        rotate: -6,
        variant: 'pill',
      },
      {
        label: 'NEC Certified',
        sub: 'Bank Loan Ready',
        posClass: 'bottom-[19%] right-[12%]',
        speed: 1.55,
        rotate: 8,
        variant: 'seal',
      },
    ],
  },
  {
    index: '03',
    title: 'Fair Valuation',
    titleBn: 'স্বচ্ছ মূল্য ও বিনিয়োগ পরামর্শ',
    category: 'Direct Developer Pricing',
    description:
      'Data-backed market appraisals and direct owner-to-buyer transactions with zero hidden markups, paired with tailored bank mortgage and milestone installment planning.',
    ctaLabel: 'REQUEST VALUATION',
    ctaAction: 'consult',
    leftBg: '#CBB9A6',
    swatchColor: '#B89B7A',
    rimTone: '#F6F1EA',
    image: valuationImg,
    imageCaption: 'TRANSPARENT LEDGER · DIRECT RATE',
    metricCode: 'ZERO HIDDEN FEE',
    metricValue: 'Direct Pricing',
    instrumentLabel: 'VALUATION INDEX',
    instrumentCode: 'ROI · SQFT BENCHMARK',
    Icon: Scale,
    tokens: [
      {
        label: '0% Hidden Markup',
        sub: 'Direct Agreement',
        posClass: 'top-[13%] left-[17%]',
        speed: 1.45,
        rotate: -6,
        variant: 'pill',
      },
      {
        label: 'Flexible EMI',
        sub: 'Milestone Linked',
        posClass: 'bottom-[15%] left-[19%]',
        speed: 1.3,
        rotate: 5,
        variant: 'pill',
      },
      {
        label: 'High Rental Yield',
        sub: 'Appreciation Data',
        posClass: 'bottom-[17%] right-[13%]',
        speed: 1.5,
        rotate: -7,
        variant: 'seal',
      },
    ],
  },
  {
    index: '04',
    title: 'Structural Audit',
    titleBn: 'নির্মাণ মান ও প্রকৌশল নিরীক্ষা',
    category: 'BNBC Engineering Compliance',
    description:
      'Independent civil engineering verification of sub-soil bearing tests, Grade-60 seismic steel reinforcement, concrete cylinder strength, and acoustic & thermal insulation.',
    ctaLabel: 'INSPECT STANDARDS',
    ctaAction: 'explore',
    leftBg: '#B89F88',
    swatchColor: '#8C5E35',
    rimTone: '#F4EFE8',
    image: structuralImg,
    imageCaption: 'SEISMIC CORE & FOUNDATION AUDIT',
    metricCode: 'BNBC COMPLIANT',
    metricValue: 'Grade-60 Steel',
    instrumentLabel: 'STRUCTURAL CLINOMETER',
    instrumentCode: 'SEISMIC ZONE · A+',
    Icon: ShieldCheck,
    tokens: [
      {
        label: 'Soil Test Vetted',
        sub: 'Deep Pile Foundation',
        posClass: 'top-[14%] left-[18%]',
        speed: 1.3,
        rotate: 6,
        variant: 'pill',
      },
      {
        label: 'Grade-60 Rebar',
        sub: 'Lab Tested PSI',
        posClass: 'bottom-[15%] left-[21%]',
        speed: 1.55,
        rotate: -8,
        variant: 'pill',
      },
      {
        label: 'Live Milestones',
        sub: 'Stage-by-Stage Log',
        posClass: 'bottom-[18%] right-[12%]',
        speed: 1.25,
        rotate: 5,
        variant: 'seal',
      },
    ],
  },
  {
    index: '05',
    title: 'Turnkey Handover',
    titleBn: 'চাবি হস্তান্তর ও ইন্টেরিয়র সলিউশন',
    category: 'End-to-End Delivery & Interiors',
    description:
      'From final sub-registry deed execution and utility meter transfers to bespoke architectural interior fit-outs—we manage every detail until we place the keys in your hand.',
    ctaLabel: 'BOOK CONSULTATION',
    ctaAction: 'consult',
    leftBg: '#A49283',
    swatchColor: '#3B281B',
    rimTone: '#F8F5F0',
    image: interiorImg,
    imageCaption: 'BESPOKE INTERIOR · READY FOR LIVING',
    metricCode: 'ON-TIME DELIVERY',
    metricValue: 'Turnkey Ready',
    instrumentLabel: 'HANDOVER PROTOCOL',
    instrumentCode: 'DEED · UTILITY · KEY',
    Icon: KeyRound,
    tokens: [
      {
        label: 'Deed Registration',
        sub: 'Full Legal Escort',
        posClass: 'top-[13%] left-[18%]',
        speed: 1.4,
        rotate: -7,
        variant: 'pill',
      },
      {
        label: 'Bespoke Interiors',
        sub: 'Cabinetry & Lighting',
        posClass: 'bottom-[15%] left-[20%]',
        speed: 1.35,
        rotate: 6,
        variant: 'pill',
      },
      {
        label: 'Guaranteed Key',
        sub: 'On-Schedule Handover',
        posClass: 'bottom-[18%] right-[13%]',
        speed: 1.5,
        rotate: -5,
        variant: 'seal',
      },
    ],
  },
];

const TOTAL_SLIDES = SOLUTIONS.length;

export const PropertySolutionsSection: React.FC<PropertySolutionsSectionProps> = ({
  onExplore,
  onConsult,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const activeIndexRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);
  const queuedIndexRef = useRef<number | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const leftStageRef = useRef<HTMLDivElement>(null);
  const bgLayersRef = useRef<(HTMLDivElement | null)[]>([]);
  const leftSlidesRef = useRef<(HTMLDivElement | null)[]>([]);
  const rightSlidesRef = useRef<(HTMLElement | null)[]>([]);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  // Set initial GSAP states for all 5 slides
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      SOLUTIONS.forEach((_, idx) => {
        const bgEl = bgLayersRef.current[idx];
        const leftEl = leftSlidesRef.current[idx];
        const rightEl = rightSlidesRef.current[idx];

        if (bgEl) {
          gsap.set(bgEl, {
            yPercent: idx === 0 ? 0 : -100,
            zIndex: idx === 0 ? 2 : 1,
            force3D: true,
          });
        }

        if (leftEl) {
          const platter = leftEl.querySelector('[data-platter]');
          const instrument = leftEl.querySelector('[data-instrument]');
          const botanical = leftEl.querySelector('[data-botanical]');
          const beans = leftEl.querySelectorAll('[data-bean]');
          const tokens = leftEl.querySelectorAll('[data-token]');

          gsap.set(leftEl, {
            autoAlpha: idx === 0 ? 1 : 0,
            zIndex: idx === 0 ? 10 : 1,
          });

          if (platter) {
            gsap.set(platter, {
              y: idx === 0 ? 0 : -140,
              scale: idx === 0 ? 1 : 0.9,
              rotation: idx === 0 ? 0 : -6,
              autoAlpha: idx === 0 ? 1 : 0,
              force3D: true,
            });
          }
          if (instrument) {
            gsap.set(instrument, {
              y: idx === 0 ? 0 : -190,
              rotation: idx === 0 ? 0 : -8,
              autoAlpha: idx === 0 ? 1 : 0,
              force3D: true,
            });
          }
          if (botanical) {
            gsap.set(botanical, {
              y: idx === 0 ? 0 : -160,
              rotation: idx === 0 ? 0 : 15,
              autoAlpha: idx === 0 ? 1 : 0,
              force3D: true,
            });
          }
          if (beans.length) {
            gsap.set(beans, {
              y: idx === 0 ? 0 : -150,
              autoAlpha: idx === 0 ? 1 : 0,
              force3D: true,
            });
          }
          if (tokens.length) {
            gsap.set(tokens, {
              y: idx === 0 ? 0 : -130,
              autoAlpha: idx === 0 ? 1 : 0,
              force3D: true,
            });
          }
        }

        if (rightEl) {
          gsap.set(rightEl, {
            y: idx === 0 ? 0 : 195,
            autoAlpha: idx === 0 ? 1 : 0,
            zIndex: idx === 0 ? 10 : 1,
            pointerEvents: idx === 0 ? 'auto' : 'none',
            force3D: true,
          });
        }
      });
    }, section);

    return () => ctx.revert();
  }, []);

  /**
   * Executes the two-stage Slider-Revolution-style split transition:
   * - Left panel: Full-bleed vertical tonal curtain wipe + staggered multi-plane parallax
   *   for the circular architectural platter, left vertical brass instrument, botanical sprig,
   *   and peripheral tokens.
   * - Right panel: Vertical editorial reel where the outgoing slide dims to a ~0.22 ghost
   *   state and glides upward while the incoming slide rises from below at ~0.24 ghost opacity
   *   before blooming into 100% crisp focus at the vertical center.
   */
  const runSlideTransition = useCallback((targetIdx: number) => {
    const prevIdx = activeIndexRef.current;
    if (targetIdx === prevIdx || targetIdx < 0 || targetIdx >= TOTAL_SLIDES) {
      return;
    }

    if (isAnimatingRef.current) {
      queuedIndexRef.current = targetIdx;
      return;
    }

    isAnimatingRef.current = true;
    const dir = targetIdx > prevIdx ? 1 : -1;
    activeIndexRef.current = targetIdx;
    setActiveIndex(targetIdx);

    const prevBg = bgLayersRef.current[prevIdx];
    const nextBg = bgLayersRef.current[targetIdx];
    const prevLeft = leftSlidesRef.current[prevIdx];
    const nextLeft = leftSlidesRef.current[targetIdx];
    const prevRight = rightSlidesRef.current[prevIdx];
    const nextRight = rightSlidesRef.current[targetIdx];

    const tl = gsap.timeline({
      defaults: { force3D: true },
      onComplete: () => {
        isAnimatingRef.current = false;
        if (queuedIndexRef.current !== null && queuedIndexRef.current !== activeIndexRef.current) {
          const nextQueued = queuedIndexRef.current;
          queuedIndexRef.current = null;
          runSlideTransition(nextQueued);
        } else {
          queuedIndexRef.current = null;
        }
      },
    });

    // -------------------------------------------------------------------------
    // 1. LEFT PANEL TONAL BACKGROUND CURTAIN WIPE
    // -------------------------------------------------------------------------
    if (prevBg && nextBg) {
      SOLUTIONS.forEach((_, i) => {
        const layer = bgLayersRef.current[i];
        if (layer && i !== prevIdx && i !== targetIdx) {
          gsap.set(layer, { zIndex: 0 });
        }
      });
      gsap.set(prevBg, { zIndex: 2, yPercent: 0 });
      gsap.set(nextBg, { zIndex: 3, yPercent: dir > 0 ? -100 : 100 });

      tl.to(
        nextBg,
        {
          yPercent: 0,
          duration: 0.92,
          ease: 'power3.inOut',
        },
        0
      );
      tl.to(
        prevBg,
        {
          yPercent: dir > 0 ? 28 : -28,
          duration: 0.92,
          ease: 'power3.inOut',
        },
        0
      );
    }

    // -------------------------------------------------------------------------
    // 2. LEFT PANEL MULTI-PLANE OBJECT PARALLAX (Platter, Instrument, Satellites)
    // -------------------------------------------------------------------------
    if (prevLeft) {
      const prevPlatter = prevLeft.querySelector('[data-platter]');
      const prevInstrument = prevLeft.querySelector('[data-instrument]');
      const prevBotanical = prevLeft.querySelector('[data-botanical]');
      const prevBeans = prevLeft.querySelectorAll('[data-bean]');
      const prevTokens = prevLeft.querySelectorAll('[data-token]');

      gsap.set(prevLeft, { zIndex: 5 });

      if (prevPlatter) {
        tl.to(
          prevPlatter,
          {
            y: dir * 155,
            scale: 0.91,
            rotation: dir * 7,
            autoAlpha: 0,
            duration: 0.62,
            ease: 'power2.in',
          },
          0
        );
      }
      if (prevInstrument) {
        tl.to(
          prevInstrument,
          {
            y: dir * 215,
            rotation: dir * 10,
            autoAlpha: 0,
            duration: 0.58,
            ease: 'power2.in',
          },
          0
        );
      }
      if (prevBotanical) {
        tl.to(
          prevBotanical,
          {
            y: dir * 195,
            rotation: dir * -18,
            autoAlpha: 0,
            duration: 0.56,
            ease: 'power2.in',
          },
          0.02
        );
      }
      if (prevBeans.length) {
        tl.to(
          prevBeans,
          {
            y: (i) => dir * (160 + i * 35),
            rotation: (i) => dir * (i % 2 === 0 ? 22 : -22),
            autoAlpha: 0,
            duration: 0.52,
            stagger: 0.02,
            ease: 'power2.in',
          },
          0
        );
      }
      if (prevTokens.length) {
        tl.to(
          prevTokens,
          {
            y: (i) => dir * (145 + i * 30),
            autoAlpha: 0,
            duration: 0.5,
            stagger: 0.03,
            ease: 'power2.in',
          },
          0
        );
      }
      tl.set(prevLeft, { autoAlpha: 0, zIndex: 1 }, 0.64);
    }

    if (nextLeft) {
      const nextPlatter = nextLeft.querySelector('[data-platter]');
      const nextInstrument = nextLeft.querySelector('[data-instrument]');
      const nextBotanical = nextLeft.querySelector('[data-botanical]');
      const nextBeans = nextLeft.querySelectorAll('[data-bean]');
      const nextTokens = nextLeft.querySelectorAll('[data-token]');

      gsap.set(nextLeft, { autoAlpha: 1, zIndex: 10 });

      if (nextPlatter) {
        tl.fromTo(
          nextPlatter,
          {
            y: -dir * 165,
            scale: 0.9,
            rotation: -dir * 8,
            autoAlpha: 0,
          },
          {
            y: 0,
            scale: 1,
            rotation: 0,
            autoAlpha: 1,
            duration: 0.86,
            ease: 'power3.out',
          },
          0.2
        );
      }
      if (nextInstrument) {
        tl.fromTo(
          nextInstrument,
          {
            y: -dir * 225,
            rotation: -dir * 11,
            autoAlpha: 0,
          },
          {
            y: 0,
            rotation: 0,
            autoAlpha: 1,
            duration: 0.92,
            ease: 'power3.out',
          },
          0.15
        );
      }
      if (nextBotanical) {
        tl.fromTo(
          nextBotanical,
          {
            y: -dir * 200,
            rotation: -dir * 20,
            autoAlpha: 0,
          },
          {
            y: 0,
            rotation: 0,
            autoAlpha: 1,
            duration: 0.9,
            ease: 'power3.out',
          },
          0.24
        );
      }
      if (nextBeans.length) {
        tl.fromTo(
          nextBeans,
          {
            y: (i) => -dir * (170 + i * 38),
            rotation: (i) => -dir * (i % 2 === 0 ? 25 : -25),
            autoAlpha: 0,
          },
          {
            y: 0,
            rotation: 0,
            autoAlpha: 1,
            duration: 0.88,
            stagger: 0.035,
            ease: 'power3.out',
          },
          0.22
        );
      }
      if (nextTokens.length) {
        tl.fromTo(
          nextTokens,
          {
            y: (i) => -dir * (140 + i * 28),
            autoAlpha: 0,
          },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.82,
            stagger: 0.045,
            ease: 'power3.out',
          },
          0.28
        );
      }
    }

    // -------------------------------------------------------------------------
    // 3. RIGHT PANEL VERTICAL EDITORIAL REEL (Two-phase ghosted reel motion)
    //    Phase A (0 -> 0.34s): Outgoing slide softens to ~0.22 opacity & starts
    //    gliding vertically while incoming slide appears at ~0.24 ghost opacity
    //    below/above—so both appear as an editorial vertical reel mid-transition.
    //    Phase B (0.34 -> 0.96s): Outgoing slide glides out while incoming slide
    //    settles into the center at full opacity: 1.
    // -------------------------------------------------------------------------
    if (prevRight && nextRight) {
      gsap.set(prevRight, { zIndex: 5, pointerEvents: 'none' });
      gsap.set(nextRight, {
        zIndex: 10,
        pointerEvents: 'auto',
        y: dir * 195,
        autoAlpha: 0,
      });

      // Outgoing slide: soften to ghost opacity while drifting out along vertical reel
      tl.to(
        prevRight,
        {
          y: -dir * 72,
          autoAlpha: 0.22,
          duration: 0.34,
          ease: 'power2.out',
        },
        0
      ).to(
        prevRight,
        {
          y: -dir * 205,
          autoAlpha: 0,
          duration: 0.58,
          ease: 'power3.inOut',
        },
        0.34
      );

      // Incoming slide: enter as ghosted reel preview, then glide to center & sharpen
      tl.to(
        nextRight,
        {
          y: dir * 118,
          autoAlpha: 0.24,
          duration: 0.34,
          ease: 'power2.out',
        },
        0.04
      ).to(
        nextRight,
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.62,
          ease: 'power3.out',
        },
        0.34
      );
    }
  }, []);

  // Desktop ScrollTrigger pinning: scrolling through the section steps cleanly through all 5 solutions
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=240%',
        pin: true,
        anticipatePin: 1,
        scrub: 0.35,
        snap: {
          snapTo: 1 / (TOTAL_SLIDES - 1),
          duration: { min: 0.25, max: 0.55 },
          delay: 0.04,
          ease: 'power2.inOut',
        },
        onUpdate: (self) => {
          if (isProgrammaticScrollRef.current) return;
          const idx = Math.min(
            TOTAL_SLIDES - 1,
            Math.max(0, Math.round(self.progress * (TOTAL_SLIDES - 1)))
          );
          if (idx !== activeIndexRef.current) {
            runSlideTransition(idx);
          }
        },
      });

      scrollTriggerRef.current = st;
      return () => {
        st.kill();
        scrollTriggerRef.current = null;
      };
    });

    return () => mm.revert();
  }, [runSlideTransition]);

  // Navigate to a specific slide via click (center swatches or bottom-right arrows)
  const handleSelectSlide = useCallback(
    (targetIdx: number) => {
      const clamped = Math.min(TOTAL_SLIDES - 1, Math.max(0, targetIdx));
      if (clamped === activeIndexRef.current) return;

      runSlideTransition(clamped);

      // Sync ScrollTrigger scroll position if pinned on desktop
      const st = scrollTriggerRef.current;
      if (st && st.isActive) {
        const targetScroll =
          st.start + (st.end - st.start) * (clamped / (TOTAL_SLIDES - 1));
        isProgrammaticScrollRef.current = true;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        window.setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 650);
      }
    },
    [runSlideTransition]
  );

  const handleStep = useCallback(
    (delta: number) => {
      const next = (activeIndexRef.current + delta + TOTAL_SLIDES) % TOTAL_SLIDES;
      handleSelectSlide(next);
    },
    [handleSelectSlide]
  );

  // Subtle interactive pointer parallax on the Left Stage
  useEffect(() => {
    const stage = leftStageRef.current;
    if (!stage) return;

    const mq = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!mq.matches) return;

    const onPointerMove = (e: PointerEvent) => {
      if (isAnimatingRef.current) return;
      const rect = stage.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;

      const currentLeft = leftSlidesRef.current[activeIndexRef.current];
      if (!currentLeft) return;

      const platter = currentLeft.querySelector('[data-platter-inner]');
      const instrument = currentLeft.querySelector('[data-instrument-inner]');
      const botanical = currentLeft.querySelector('[data-botanical-inner]');
      const tokens = currentLeft.querySelectorAll('[data-token-inner]');

      if (platter) {
        gsap.to(platter, { x: nx * 10, y: ny * 10, duration: 0.6, ease: 'power2.out' });
      }
      if (instrument) {
        gsap.to(instrument, { x: -nx * 14, y: -ny * 12, duration: 0.65, ease: 'power2.out' });
      }
      if (botanical) {
        gsap.to(botanical, { x: nx * 18, y: -ny * 14, duration: 0.7, ease: 'power2.out' });
      }
      if (tokens.length) {
        gsap.to(tokens, {
          x: (i) => (i % 2 === 0 ? nx * 15 : -nx * 13),
          y: (i) => (i % 2 === 0 ? -ny * 12 : ny * 14),
          duration: 0.65,
          ease: 'power2.out',
        });
      }
    };

    const onPointerLeave = () => {
      const currentLeft = leftSlidesRef.current[activeIndexRef.current];
      if (!currentLeft) return;
      const targets = currentLeft.querySelectorAll(
        '[data-platter-inner], [data-instrument-inner], [data-botanical-inner], [data-token-inner]'
      );
      gsap.to(targets, { x: 0, y: 0, duration: 0.7, ease: 'power2.out' });
    };

    stage.addEventListener('pointermove', onPointerMove, { passive: true });
    stage.addEventListener('pointerleave', onPointerLeave, { passive: true });
    return () => {
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <section
      id="solutions"
      ref={sectionRef}
      aria-label="Jonopod Property Solutions & Features"
      className="relative w-full min-h-screen lg:h-screen lg:h-[100dvh] overflow-hidden bg-[#F3EFEA] text-[#181512] border-t border-[#181512]/[0.08] select-none"
    >
      <div className="relative w-full h-full min-h-screen lg:min-h-0 grid grid-cols-1 lg:grid-cols-2">
        {/* ===================================================================
            LEFT HALF (50%): DYNAMIC TONAL WIPE & MULTI-PLANE ARCHITECTURAL STAGE
        ==================================================================== */}
        <div
          ref={leftStageRef}
          className="relative w-full min-h-[480px] sm:min-h-[540px] lg:h-full overflow-hidden flex items-center justify-center"
        >
          {/* Full-bleed vertical-wiping tonal background layers */}
          {SOLUTIONS.map((slide, idx) => (
            <div
              key={slide.index}
              ref={(el) => {
                bgLayersRef.current[idx] = el;
              }}
              style={{ backgroundColor: slide.leftBg }}
              className="absolute inset-0 will-change-transform"
              aria-hidden="true"
            >
              {/* Subtle radial studio lighting & matte paper texture */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 52% 46%, rgba(255,255,255,0.26) 0%, rgba(24,21,18,0.08) 72%, rgba(24,21,18,0.18) 100%)',
                }}
              />
            </div>
          ))}

          {/* Top-Left Brand / Section Signature (matches "coffee flavours" mark in video) */}
          <div className="absolute top-6 left-6 sm:top-8 sm:left-9 lg:top-10 lg:left-11 z-20 flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#181512] text-[#F5F1EB] shadow-sm">
              <Compass className="w-3.5 h-3.5" />
            </span>
            <span className="font-display font-semibold text-base sm:text-lg tracking-[-0.01em] text-[#181512]">
              property solutions
            </span>
          </div>

          {/* Bottom-Left Vertical Rotated Editorial Credit (matches vertical left text in video) */}
          <div
            aria-hidden="true"
            className="hidden sm:flex absolute bottom-9 left-7 lg:bottom-11 lg:left-9 z-20 items-center"
          >
            <span
              style={{ writingMode: 'vertical-rl' }}
              className="rotate-180 font-mono text-[10px] tracking-[0.24em] uppercase text-[#181512]/65"
            >
              © Jonopod Properties · Rajshahi
            </span>
          </div>

          {/* Per-Slide Multi-Plane Visual Compositions */}
          {SOLUTIONS.map((slide, idx) => {
            const SlideIcon = slide.Icon;
            return (
              <div
                key={slide.index}
                ref={(el) => {
                  leftSlidesRef.current[idx] = el;
                }}
                aria-hidden={activeIndex !== idx}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                {/* -------------------------------------------------------------
                    1. LEFT VERTICAL ARCHITECT'S INSTRUMENT (Mirrors the vertical
                       spoon on the left of the circular cup in the video)
                -------------------------------------------------------------- */}
                <div
                  data-instrument
                  className="hidden sm:flex absolute left-[8%] md:left-[11%] lg:left-[10%] xl:left-[12%] top-1/2 -translate-y-1/2 z-10 will-change-transform"
                >
                  <div
                    data-instrument-inner
                    className="relative flex flex-col items-center"
                  >
                    {/* Top brass finial cap */}
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#DFC39D] via-[#9A6B3B] to-[#4A3118] shadow-[0_6px_14px_rgba(24,21,18,0.35)] border border-white/40" />
                    {/* Slender graduated architectural scale stem */}
                    <div className="relative w-3.5 h-36 lg:h-44 -my-1 rounded-full bg-gradient-to-r from-[#5D4834] via-[#C8A77E] to-[#463423] shadow-[-10px_18px_24px_rgba(24,21,18,0.32)] flex flex-col justify-between py-4 px-0.5 overflow-hidden">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((tick) => (
                        <span
                          key={tick}
                          className={`block h-[1px] bg-[#181512]/55 ${
                            tick % 2 === 0 ? 'w-2.5' : 'w-1.5'
                          }`}
                        />
                      ))}
                    </div>
                    {/* Bottom circular compass / plumb bob bowl (spoon bowl silhouette) */}
                    <div className="w-11 h-14 rounded-full bg-gradient-to-br from-[#D8B992] via-[#8F6339] to-[#3B2714] p-1 shadow-[-12px_22px_30px_rgba(24,21,18,0.38)] border border-white/30 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-[#241B14] flex flex-col items-center justify-center text-[#E6CA9E] border border-[#C89B62]/40">
                        <SlideIcon className="w-4 h-4 text-[#E6CA9E]" />
                        <span className="mt-0.5 font-mono text-[7px] tracking-widest uppercase">
                          {slide.index}
                        </span>
                      </div>
                    </div>
                    {/* Vertical micro-engraving label beside the instrument */}
                    <span
                      style={{ writingMode: 'vertical-rl' }}
                      className="mt-3 rotate-180 font-mono text-[8.5px] tracking-[0.24em] uppercase text-[#181512]/70 font-medium"
                    >
                      {slide.instrumentCode}
                    </span>
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    2. TOP-RIGHT BOTANICAL / ARCHITECTURAL FOLIAGE ACCENT
                       (Mirrors the dried leaf/flower at top-right of the video)
                -------------------------------------------------------------- */}
                <div
                  data-botanical
                  className="absolute top-[11%] right-[16%] sm:right-[18%] lg:top-[12%] lg:right-[19%] z-10 will-change-transform"
                >
                  <div data-botanical-inner className="relative">
                    <svg
                      width="74"
                      height="64"
                      viewBox="0 0 74 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="drop-shadow-[-10px_14px_14px_rgba(24,21,18,0.26)]"
                    >
                      {/* Pressed architectural olive / terracotta leaf sprig */}
                      <path
                        d="M14 52C26 40 44 24 64 12"
                        stroke="#5A3921"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M36 30C33 17 43 7 58 8C57 22 47 31 36 30Z"
                        fill="url(#leafGradA)"
                        stroke="#4B2E19"
                        strokeWidth="0.9"
                      />
                      <path
                        d="M22 43C17 31 24 20 38 19C39 32 31 42 22 43Z"
                        fill="url(#leafGradB)"
                        stroke="#4B2E19"
                        strokeWidth="0.9"
                      />
                      <path
                        d="M36 33C48 31 59 38 61 50C48 52 38 44 36 33Z"
                        fill="url(#leafGradA)"
                        stroke="#4B2E19"
                        strokeWidth="0.9"
                      />
                      <defs>
                        <linearGradient id="leafGradA" x1="20" y1="8" x2="60" y2="50" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#A66E44" />
                          <stop offset="0.55" stopColor="#7C4D2B" />
                          <stop offset="1" stopColor="#4B2C17" />
                        </linearGradient>
                        <linearGradient id="leafGradB" x1="18" y1="18" x2="42" y2="44" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#C18A5B" />
                          <stop offset="1" stopColor="#6B4123" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    3. SCATTERED TACTILE ARCHITECTURAL STONES / PINS
                       (Mirrors the 5-6 scattered coffee beans in the video)
                -------------------------------------------------------------- */}
                {[
                  'top-[24%] left-[25%] rotate-[24deg]',
                  'top-[21%] right-[13%] -rotate-[18deg]',
                  'bottom-[23%] left-[14%] rotate-[35deg]',
                  'bottom-[11%] left-[44%] -rotate-[14deg]',
                  'bottom-[10%] right-[25%] rotate-[28deg]',
                ].map((pos, bIdx) => (
                  <div
                    key={bIdx}
                    data-bean
                    className={`hidden sm:block absolute ${pos} z-10 will-change-transform`}
                  >
                    <div className="w-5 h-3.5 rounded-full bg-gradient-to-br from-[#4D3422] via-[#2B1C11] to-[#160E08] shadow-[-6px_10px_12px_rgba(24,21,18,0.36)] border border-[#9A6B3B]/30 flex items-center justify-center">
                      <div className="w-3 h-[1.5px] rounded-full bg-[#9A6B3B]/50" />
                    </div>
                  </div>
                ))}

                {/* -------------------------------------------------------------
                    4. FLOATING PERIPHERAL DELIVERABLE TOKENS
                -------------------------------------------------------------- */}
                {slide.tokens.map((token, tIdx) => (
                  <div
                    key={token.label}
                    data-token
                    className={`hidden md:block absolute ${token.posClass} z-20 will-change-transform`}
                  >
                    <div
                      data-token-inner
                      style={{ transform: `rotate(${token.rotate}deg)` }}
                      className="rounded-xl bg-[#FAF8F4]/92 backdrop-blur-md border border-[#181512]/12 px-3.5 py-2 shadow-[-10px_18px_32px_-8px_rgba(24,21,18,0.28)]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#9A6B3B]" />
                        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] uppercase text-[#181512]">
                          {token.label}
                        </span>
                      </div>
                      <div className="mt-0.5 pl-4 font-sans text-[11px] text-[#5C5346]">
                        {token.sub}
                      </div>
                    </div>
                  </div>
                ))}

                {/* -------------------------------------------------------------
                    5. CENTERPIECE CIRCULAR ARCHITECTURAL VESSEL / LOUPE
                       (Mirrors the centered top-down circular cup & right handle)
                -------------------------------------------------------------- */}
                <div
                  data-platter
                  className="relative z-15 flex items-center justify-center will-change-transform"
                >
                  <div data-platter-inner className="relative flex items-center justify-center">
                    {/* Deep ambient contact shadow cast toward bottom-left (like the video) */}
                    <div
                      aria-hidden="true"
                      className="absolute -bottom-6 -left-6 w-full h-full rounded-full bg-[#181512]/32 blur-2xl"
                    />

                    {/* Right-side protruding ceramic/brass lug handle (3 o'clock position, matching the cup handle in the video!) */}
                    <div
                      aria-hidden="true"
                      className="absolute -right-5 sm:-right-7 top-1/2 -translate-y-1/2 w-8 sm:w-10 h-6 sm:h-7 rounded-r-md bg-gradient-to-b from-[#FAF8F4] via-[#EAE3D9] to-[#C8BEB0] shadow-[6px_12px_20px_rgba(24,21,18,0.3)] border border-white/70 flex items-center justify-center"
                    >
                      <span className="w-3.5 h-1 rounded-full bg-[#9A6B3B]/60" />
                    </div>

                    {/* Outer Ceramic / Travertine Circular Rim */}
                    <div
                      style={{ backgroundColor: slide.rimTone }}
                      className="relative w-[245px] h-[245px] sm:w-[310px] sm:h-[310px] lg:w-[340px] lg:h-[340px] xl:w-[376px] xl:h-[376px] rounded-full p-3.5 sm:p-4 shadow-[-18px_28px_55px_rgba(24,21,18,0.36),inset_0_2px_5px_rgba(255,255,255,0.95),inset_0_-3px_8px_rgba(24,21,18,0.12)] border border-white/80 flex items-center justify-center"
                    >
                      {/* Inner Architectural Lens Viewport */}
                      <div className="relative w-full h-full rounded-full overflow-hidden bg-[#181512] shadow-[inset_0_10px_28px_rgba(0,0,0,0.55)]">
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-full object-cover object-center scale-[1.04]"
                          draggable={false}
                        />

                        {/* Subtle warm architectural vignette inside the circular vessel */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              'radial-gradient(circle at 50% 45%, transparent 45%, rgba(24,21,18,0.58) 100%)',
                          }}
                        />

                        {/* Architectural Compass Reticle Ring inside the circle */}
                        <div className="absolute inset-3.5 sm:inset-4 rounded-full border border-white/30 pointer-events-none flex flex-col items-center justify-between py-3.5 px-4">
                          {/* Top degree/code micro-tag */}
                          <span className="px-2.5 py-0.5 rounded-full bg-[#181512]/65 backdrop-blur-md border border-white/20 font-mono text-[8.5px] sm:text-[9px] tracking-[0.22em] uppercase text-[#F5EFE6]">
                            {slide.metricCode}
                          </span>

                          {/* Bottom glassmorphic architectural caption pill */}
                          <div className="text-center px-3.5 py-1.5 rounded-full bg-[#181512]/75 backdrop-blur-md border border-white/20 shadow-md">
                            <span className="block font-mono text-[8.5px] sm:text-[9.5px] tracking-[0.18em] uppercase text-[#E6CA9E] font-medium">
                              {slide.metricValue}
                            </span>
                          </div>
                        </div>

                        {/* Glossy optical highlight arc */}
                        <div
                          aria-hidden="true"
                          className="absolute -top-1/2 -left-1/4 w-full h-full rounded-full bg-gradient-to-br from-white/20 via-white/5 to-transparent rotate-12 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===================================================================
            CENTER SPINE (50% SEAM): 5 CIRCULAR TONAL SWATCH INDICATORS
            Straddles the exact 50/50 dividing line between Left and Right halves
        ==================================================================== */}
        <div
          role="tablist"
          aria-label="Property solution slides"
          className="relative lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-30 flex lg:flex-col items-center justify-center gap-3.5 sm:gap-4 py-4 lg:py-0 bg-[#EFECE6] lg:bg-transparent border-y border-[#181512]/10 lg:border-none"
        >
          {SOLUTIONS.map((slide, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={slide.index}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`${slide.index} ${slide.title}`}
                onClick={() => handleSelectSlide(idx)}
                className="group relative flex items-center justify-center focus:outline-none cursor-pointer"
              >
                {/* Swatch Circle */}
                <span
                  style={{ backgroundColor: slide.swatchColor }}
                  className={`block rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_4px_12px_rgba(24,21,18,0.22)] ${
                    isActive
                      ? 'w-7 h-7 sm:w-8 sm:h-8 ring-2 ring-[#181512] ring-offset-2 ring-offset-[#F3EFEA] scale-110'
                      : 'w-6 h-6 sm:w-7 sm:h-7 ring-1 ring-white/75 opacity-90 hover:opacity-100 hover:scale-110'
                  }`}
                />

                {/* Hover Tooltip Pill */}
                <span className="pointer-events-none hidden lg:flex items-center gap-1.5 absolute left-11 px-2.5 py-1 rounded-md bg-[#181512] text-[#FAF8F4] font-mono text-[9.5px] tracking-[0.18em] uppercase whitespace-nowrap opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-md">
                  <span className="text-[#C89B62]">{slide.index}</span>
                  <span>{slide.title}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ===================================================================
            RIGHT HALF (50%): VERTICAL EDITORIAL REEL & CONTROLS
        ==================================================================== */}
        <div className="relative w-full min-h-[440px] sm:min-h-[480px] lg:h-full bg-[#EFECE6] flex items-center justify-center overflow-hidden px-8 sm:px-14 md:px-20 lg:px-24 xl:px-32">
          {/* Top-Right Subtle Architectural Trust Pillars (matches top-right icons in video) */}
          <div className="absolute top-6 right-6 sm:top-8 sm:right-9 lg:top-10 lg:right-12 z-20 flex items-center gap-4 text-[#181512]/75">
            <button
              type="button"
              onClick={() => handleSelectSlide(0)}
              title="Property Discovery"
              className="hover:text-[#9A6B3B] transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleSelectSlide(1)}
              title="Legal Verification"
              className="hover:text-[#9A6B3B] transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleSelectSlide(4)}
              title="Turnkey Handover"
              className="hover:text-[#9A6B3B] transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          </div>

          {/* Vertical Editorial Reel Stage */}
          <div className="relative w-full max-w-lg h-[340px] sm:h-[360px] flex items-center">
            {SOLUTIONS.map((slide, idx) => (
              <article
                key={slide.index}
                ref={(el) => {
                  rightSlidesRef.current[idx] = el;
                }}
                aria-hidden={activeIndex !== idx}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 will-change-transform"
              >
                {/* Diagonal Fractional Counter (01 / 05 — exact match to video) */}
                <div className="inline-flex items-center mb-3 sm:mb-4 select-none">
                  <div className="relative w-9 h-9 font-mono text-[11px] text-[#786F63]">
                    <span className="absolute top-0 left-0 font-medium text-[#181512]/80">
                      {slide.index}
                    </span>
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#9A6B3B]">
                      /
                    </span>
                    <span className="absolute bottom-0 right-0 text-[#786F63]">
                      0{TOTAL_SLIDES}
                    </span>
                  </div>
                  <span className="ml-4 pl-4 border-l border-[#181512]/15 font-mono text-[10px] tracking-[0.24em] uppercase text-[#9A6B3B]">
                    {slide.category}
                  </span>
                </div>

                {/* High-Contrast Editorial Serif Title */}
                <h2 className="font-display font-bold text-4xl sm:text-5xl xl:text-[3.5rem] leading-[1.08] tracking-[-0.015em] text-[#181512]">
                  {slide.title}
                </h2>

                {/* Bengali Companion Sub-headline */}
                <p className="mt-2 font-sans text-sm sm:text-base font-medium text-[#855B30]">
                  {slide.titleBn}
                </p>

                {/* Concise Editorial Description */}
                <p className="mt-4 sm:mt-5 font-sans text-[13.5px] sm:text-[14.5px] leading-[1.7] text-[#5C5346] max-w-md">
                  {slide.description}
                </p>

                {/* Warm Camel / Bronze Rectangular CTA Button (matches "ORDER NOW" button in video) */}
                <div className="mt-7 sm:mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      if (slide.ctaAction === 'explore') {
                        onExplore?.();
                      } else {
                        onConsult?.();
                      }
                    }}
                    className="inline-flex items-center justify-center px-7 py-3.5 rounded-[3px] bg-[#C59B6D] hover:bg-[#AD8152] active:scale-[0.99] text-[#181512] font-mono text-[10.5px] font-semibold tracking-[0.2em] uppercase shadow-[0_10px_24px_-10px_rgba(154,107,59,0.5)] transition-all duration-300 cursor-pointer"
                  >
                    {slide.ctaLabel}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Bottom-Right Vertical Hairline & Up/Down Arrow Controls (matches "| ↑ ↓" in video) */}
          <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-9 lg:bottom-10 lg:right-12 z-20 flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="block w-[1px] h-11 bg-[#181512]/30"
            />
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                aria-label="Previous property solution"
                className="p-1 text-[#181512]/70 hover:text-[#181512] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <ArrowUp className="w-4 h-4 stroke-[1.5]" />
              </button>
              <button
                type="button"
                onClick={() => handleStep(1)}
                aria-label="Next property solution"
                className="p-1 text-[#181512]/70 hover:text-[#181512] hover:translate-y-0.5 transition-all cursor-pointer"
              >
                <ArrowDown className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
