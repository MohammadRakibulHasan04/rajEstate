import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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

interface SolutionSlide {
  index: string;
  title: string;
  titleBn: string;
  category: string;
  description: string;
  leftBg: string;
  swatchColor: string;
  rimTone: string;
  image: string;
}

const SOLUTIONS: SolutionSlide[] = [
  {
    index: '01',
    title: 'Property Discovery',
    titleBn: 'সঠিক প্রপার্টি নির্বাচন ও অনুসন্ধান',
    category: 'Curated Portfolio Match',
    description:
      'Handpicked residential apartments, commercial floors, and prime plots across Rajshahi—filtered by verified sunlight orientation, ventilation, and neighborhood livability.',
    leftBg: '#D7C6B4',
    swatchColor: '#E3D5C5',
    rimTone: '#F7F3ED',
    image: discoveryImg,
  },
  {
    index: '02',
    title: 'Legal Verification',
    titleBn: 'নিষ্কণ্টক দলিল ও অনুমোদন যাচাই',
    category: 'Complete Title Due Diligence',
    description:
      'Every property undergoes a 24-point legal audit covering CS/SA/RS/BS khatian chains, up-to-date mutation records, RDA sanctioned blueprints, and non-encumbrance certificates.',
    leftBg: '#9BA19F',
    swatchColor: '#919896',
    rimTone: '#EFECE6',
    image: floorPlanImg,
  },
  {
    index: '03',
    title: 'Fair Valuation',
    titleBn: 'স্বচ্ছ মূল্য ও বিনিয়োগ পরামর্শ',
    category: 'Direct Developer Pricing',
    description:
      'Data-backed market appraisals and direct owner-to-buyer transactions with zero hidden markups, paired with tailored bank mortgage and milestone installment planning.',
    leftBg: '#CBB9A6',
    swatchColor: '#B89B7A',
    rimTone: '#F6F1EA',
    image: valuationImg,
  },
  {
    index: '04',
    title: 'Structural Audit',
    titleBn: 'নির্মাণ মান ও প্রকৌশল নিরীক্ষা',
    category: 'BNBC Engineering Compliance',
    description:
      'Independent civil engineering verification of sub-soil bearing tests, Grade-60 seismic steel reinforcement, concrete cylinder strength, and acoustic & thermal insulation.',
    leftBg: '#B89F88',
    swatchColor: '#8C5E35',
    rimTone: '#F4EFE8',
    image: structuralImg,
  },
  {
    index: '05',
    title: 'Turnkey Handover',
    titleBn: 'চাবি হস্তান্তর ও ইন্টেরিয়র সলিউশন',
    category: 'End-to-End Delivery & Interiors',
    description:
      'From final sub-registry deed execution and utility meter transfers to bespoke architectural interior fit-outs—we manage every detail until we place the keys in your hand.',
    leftBg: '#A49283',
    swatchColor: '#3B281B',
    rimTone: '#F8F5F0',
    image: interiorImg,
  },
];

const TOTAL_SLIDES = SOLUTIONS.length;

export const PropertySolutionsSection: React.FC<PropertySolutionsSectionProps> = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const activeIndexRef = useRef<number>(0);

  const sectionRef = useRef<HTMLElement>(null);
  const bgLayersRef = useRef<(HTMLDivElement | null)[]>([]);
  const leftFramesRef = useRef<(HTMLDivElement | null)[]>([]);
  const rightSlidesRef = useRef<(HTMLElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // 1. Set baseline state for all 5 slides at t = 0
      SOLUTIONS.forEach((_, idx) => {
        const bgEl = bgLayersRef.current[idx];
        const frameEl = leftFramesRef.current[idx];
        const rightEl = rightSlidesRef.current[idx];

        if (bgEl) {
          gsap.set(bgEl, {
            yPercent: idx === 0 ? 0 : -100,
            zIndex: idx + 1,
            force3D: true,
          });
        }

        if (frameEl) {
          gsap.set(frameEl, {
            y: idx === 0 ? 0 : -150,
            scale: idx === 0 ? 1 : 0.92,
            autoAlpha: idx === 0 ? 1 : 0,
            zIndex: idx === 0 ? 10 : idx + 1,
            force3D: true,
          });
        }

        if (rightEl) {
          gsap.set(rightEl, {
            y: idx === 0 ? 0 : 175,
            autoAlpha: idx === 0 ? 1 : 0,
            zIndex: idx === 0 ? 10 : idx + 1,
            force3D: true,
          });
        }
      });

      // 2. Build deterministic 4-step Master Timeline (t = 0.0 -> 4.0)
      const masterTl = gsap.timeline({
        paused: true,
        defaults: { force3D: true },
      });

      for (let i = 0; i < TOTAL_SLIDES - 1; i++) {
        const nextIdx = i + 1;
        const t0 = i + 0.08;
        const dur = 0.84;

        const prevBg = bgLayersRef.current[i];
        const nextBg = bgLayersRef.current[nextIdx];
        const prevFrame = leftFramesRef.current[i];
        const nextFrame = leftFramesRef.current[nextIdx];
        const prevRight = rightSlidesRef.current[i];
        const nextRight = rightSlidesRef.current[nextIdx];

        // A. Left Stage Tonal Background Curtain Wipe
        if (nextBg) {
          masterTl.fromTo(
            nextBg,
            { yPercent: -100 },
            { yPercent: 0, duration: dur, ease: 'power2.inOut' },
            t0
          );
        }
        if (prevBg) {
          masterTl.fromTo(
            prevBg,
            { yPercent: 0 },
            { yPercent: 24, duration: dur, ease: 'power2.inOut' },
            t0
          );
        }

        // B. Left Stage Photo Frame Transition
        if (prevFrame) {
          masterTl.fromTo(
            prevFrame,
            { y: 0, scale: 1, autoAlpha: 1 },
            {
              y: 145,
              scale: 0.92,
              autoAlpha: 0,
              duration: dur * 0.62,
              ease: 'power2.in',
            },
            t0
          );
        }

        if (nextFrame) {
          masterTl.fromTo(
            nextFrame,
            { y: -155, scale: 0.92, autoAlpha: 0 },
            {
              y: 0,
              scale: 1,
              autoAlpha: 1,
              duration: dur * 0.78,
              ease: 'power2.out',
            },
            t0 + dur * 0.22
          );
        }

        // C. Right Stage Two-Phase Vertical Editorial Reel
        if (prevRight) {
          masterTl
            .fromTo(
              prevRight,
              { y: 0, autoAlpha: 1 },
              {
                y: -64,
                autoAlpha: 0.22,
                duration: dur * 0.42,
                ease: 'power1.out',
              },
              t0
            )
            .to(
              prevRight,
              {
                y: -175,
                autoAlpha: 0,
                duration: dur * 0.58,
                ease: 'power2.inOut',
              },
              t0 + dur * 0.42
            );
        }

        if (nextRight) {
          masterTl
            .fromTo(
              nextRight,
              { y: 175, autoAlpha: 0 },
              {
                y: 96,
                autoAlpha: 0.24,
                duration: dur * 0.42,
                ease: 'power1.out',
              },
              t0
            )
            .to(
              nextRight,
              {
                y: 0,
                autoAlpha: 1,
                duration: dur * 0.58,
                ease: 'power2.out',
              },
              t0 + dur * 0.42
            );
        }
      }

      masterTl.set({}, {}, TOTAL_SLIDES - 1);

      // 3. ScrollTrigger across mobile, tablet & desktop
      const isMobile = window.innerWidth < 1024;
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${isMobile ? 260 : 280}%`,
        pin: true,
        scrub: 0.35,
        anticipatePin: 1,
        fastScrollEnd: true,
        invalidateOnRefresh: true,
        snap: {
          snapTo: 1 / (TOTAL_SLIDES - 1),
          duration: { min: 0.2, max: 0.5 },
          delay: 0.05,
          ease: 'power2.inOut',
        },
        onUpdate: (self) => {
          masterTl.progress(self.progress);
          const idx = Math.min(
            TOTAL_SLIDES - 1,
            Math.max(0, Math.round(self.progress * (TOTAL_SLIDES - 1)))
          );
          if (idx !== activeIndexRef.current) {
            activeIndexRef.current = idx;
            setActiveIndex(idx);
          }
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="solutions"
      ref={sectionRef}
      aria-label="Jonopod Property Solutions & Features"
      className="relative w-full h-screen h-[100dvh] overflow-hidden bg-[#F3EFEA] text-[#181512] border-t border-[#181512]/[0.08] select-none touch-pan-y"
    >
      <div className="relative w-full h-full flex flex-col lg:grid lg:grid-cols-2">
        {/* ===================================================================
            TOP HALF (MOBILE) / LEFT HALF (DESKTOP):
            TONAL CURTAIN WIPE & CLEAN PHOTO FRAME
        ==================================================================== */}
        <div className="relative w-full h-[46%] sm:h-[48%] lg:h-full overflow-hidden flex items-center justify-center shrink-0">
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
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.22) 0%, rgba(24,21,18,0.06) 72%, rgba(24,21,18,0.15) 100%)',
                }}
              />
            </div>
          ))}

          {/* Centered Photo Frame per Slide */}
          {SOLUTIONS.map((slide, idx) => (
            <div
              key={slide.index}
              ref={(el) => {
                leftFramesRef.current[idx] = el;
              }}
              aria-hidden={activeIndex !== idx}
              className="pointer-events-none absolute inset-0 flex items-center justify-center will-change-transform"
            >
              <div
                style={{ backgroundColor: slide.rimTone }}
                className="relative w-[186px] h-[186px] sm:w-[270px] sm:h-[270px] lg:w-[348px] lg:h-[348px] xl:w-[388px] xl:h-[388px] rounded-full p-2.5 sm:p-3.5 lg:p-4 shadow-[-16px_26px_50px_rgba(24,21,18,0.32)] border border-white/80 flex items-center justify-center"
              >
                <div className="relative w-full h-full rounded-full overflow-hidden bg-[#181512]">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover object-center"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===================================================================
            CENTER SPINE (SEAM): 5 TONAL SWATCH INDICATORS
        ==================================================================== */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[46%] sm:top-[48%] lg:top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex lg:flex-col items-center justify-center gap-3 sm:gap-4"
        >
          {SOLUTIONS.map((slide, idx) => {
            const isActive = activeIndex === idx;
            return (
              <span
                key={slide.index}
                style={{ backgroundColor: slide.swatchColor }}
                className={`block rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_4px_12px_rgba(24,21,18,0.25)] ${
                  isActive
                    ? 'w-7 h-7 sm:w-8 sm:h-8 ring-2 ring-[#181512] ring-offset-2 ring-offset-[#F3EFEA] scale-110'
                    : 'w-5 h-5 sm:w-6.5 sm:h-6.5 lg:w-7 lg:h-7 ring-1 ring-white/80 opacity-90'
                }`}
              />
            );
          })}
        </div>

        {/* ===================================================================
            BOTTOM HALF (MOBILE) / RIGHT HALF (DESKTOP):
            VERTICAL EDITORIAL REEL (NO BUTTONS)
        ==================================================================== */}
        <div className="relative w-full h-[54%] sm:h-[52%] lg:h-full bg-[#EFECE6] flex items-center justify-center overflow-hidden px-6 sm:px-14 md:px-20 lg:px-24 xl:px-32">
          <div className="relative w-full max-w-lg h-full flex items-center">
            {SOLUTIONS.map((slide, idx) => {
              const isCurrent = activeIndex === idx;
              return (
                <article
                  key={slide.index}
                  ref={(el) => {
                    rightSlidesRef.current[idx] = el;
                  }}
                  aria-hidden={!isCurrent}
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 will-change-transform"
                >
                  {/* Diagonal Fractional Counter (01 / 05) */}
                  <div className="inline-flex items-center mb-2.5 sm:mb-4 select-none">
                    <div className="relative w-8 h-8 sm:w-9 sm:h-9 font-mono text-[10px] sm:text-[11px] text-[#786F63]">
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
                    <span className="ml-3 sm:ml-4 pl-3 sm:pl-4 border-l border-[#181512]/15 font-mono text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.24em] uppercase text-[#9A6B3B]">
                      {slide.category}
                    </span>
                  </div>

                  {/* High-Contrast Editorial Serif Title */}
                  <h2 className="font-display font-bold text-3xl sm:text-5xl xl:text-[3.5rem] leading-[1.08] tracking-[-0.015em] text-[#181512]">
                    {slide.title}
                  </h2>

                  {/* Bengali Companion Sub-headline */}
                  <p className="mt-1.5 sm:mt-2 font-sans text-xs sm:text-base font-medium text-[#855B30]">
                    {slide.titleBn}
                  </p>

                  {/* Concise Editorial Description */}
                  <p className="mt-3 sm:mt-5 font-sans text-[13px] sm:text-[15px] leading-[1.65] sm:leading-[1.75] text-[#5C5346] max-w-md">
                    {slide.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
