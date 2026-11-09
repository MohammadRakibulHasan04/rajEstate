import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Layers } from 'lucide-react';
import { StoryChapter } from '../../types/listing';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-driven stacked chapters:
 * As the reader scrolls, each room/chapter photograph slides up and stacks
 * physically on top of the previous photographs while the corresponding
 * narrative text transitions in alongside it.
 */
export const StoryChapters: React.FC<{ chapters: StoryChapter[] }> = ({ chapters }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const count = chapters.length;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || count === 0) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-stack-card]', section);
      const images = gsap.utils.toArray<HTMLElement>('[data-stack-img]', section);
      const scrims = gsap.utils.toArray<HTMLElement>('[data-stack-scrim]', section);
      const texts = gsap.utils.toArray<HTMLElement>('[data-ch-text]', section);
      const bgNums = gsap.utils.toArray<HTMLElement>('[data-ch-bgnum]', section);

      // Initial state for Card 0 (base of the stack) and subsequent cards
      cards.forEach((card, i) => {
        if (i === 0) {
          gsap.set(card, {
            yPercent: 0,
            y: 0,
            scale: 1,
            rotate: 0,
            autoAlpha: 1,
            zIndex: 10,
          });
        } else {
          gsap.set(card, {
            yPercent: 112,
            y: 0,
            scale: 1.05,
            rotate: i % 2 === 0 ? -1.6 : 1.6,
            autoAlpha: 0,
            zIndex: 10 + i,
          });
        }
      });

      images.forEach((img, i) => {
        gsap.set(img, {
          scale: i === 0 ? 1 : 1.16,
          yPercent: i === 0 ? 0 : 8,
        });
      });

      scrims.forEach((scrim) => {
        gsap.set(scrim, { autoAlpha: 0 });
      });

      texts.forEach((txt, i) => {
        const items = txt.querySelectorAll('[data-text-item]');
        const line = txt.querySelector('[data-text-line]');
        if (i === 0) {
          gsap.set(txt, { autoAlpha: 1, y: 0, pointerEvents: 'auto' });
          gsap.set(items, { autoAlpha: 1, y: 0 });
          if (line) gsap.set(line, { scaleX: 1 });
        } else {
          gsap.set(txt, { autoAlpha: 0, y: 36, pointerEvents: 'none' });
          gsap.set(items, { autoAlpha: 0, y: 24 });
          if (line) gsap.set(line, { scaleX: 0 });
        }
      });

      bgNums.forEach((num, i) => {
        gsap.set(num, {
          autoAlpha: i === 0 ? 1 : 0,
          yPercent: i === 0 ? 0 : 25,
        });
      });

      if (count <= 1) return;

      const leadHold = 0.25;
      const tailHold = 0.35;
      const stepDuration = 1;

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * Math.max(1.4, (count - 1) * 0.95))}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          refreshPriority: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressFillRef.current) {
              progressFillRef.current.style.transform = `scaleX(${self.progress})`;
            }
            const nextIdx = Math.min(
              count - 1,
              Math.max(0, Math.round(self.progress * (count - 1)))
            );
            if (nextIdx !== activeRef.current) {
              activeRef.current = nextIdx;
              setActiveIndex(nextIdx);
            }
          },
        },
      });

      stRef.current = tl.scrollTrigger ?? null;

      // Initial breathing hold for Chapter 01
      tl.to({}, { duration: leadHold }, 0);

      for (let step = 1; step < count; step++) {
        const start = leadHold + (step - 1) * stepDuration;
        const incomingCard = cards[step];
        const incomingImg = images[step];
        const prevText = texts[step - 1];
        const nextText = texts[step];
        const prevBgNum = bgNums[step - 1];
        const nextBgNum = bgNums[step];

        // 1. Incoming photo card rises and lands onto the stack
        tl.to(
          incomingCard,
          {
            autoAlpha: 1,
            duration: 0.12,
            ease: 'power1.out',
          },
          start
        )
          .to(
            incomingCard,
            {
              yPercent: 0,
              scale: 1,
              rotate: 0,
              duration: 0.82,
              ease: 'power3.inOut',
            },
            start
          )
          .to(
            incomingImg,
            {
              scale: 1,
              yPercent: 0,
              duration: 0.85,
              ease: 'power2.out',
            },
            start
          );

        // 2. All previous photo cards settle deeper into the visible stack behind
        for (let prev = 0; prev < step; prev++) {
          const depth = step - prev;
          const clampedDepth = Math.min(depth, 4);
          const stackOffsetY = -clampedDepth * 18;
          const stackScale = 1 - clampedDepth * 0.045;
          const stackRotate = (prev % 2 === 0 ? -1 : 1) * Math.min(depth, 3) * 0.65;
          const scrimAlpha = Math.min(depth * 0.22, 0.72);

          tl.to(
            cards[prev],
            {
              y: stackOffsetY,
              scale: stackScale,
              rotate: stackRotate,
              duration: 0.82,
              ease: 'power3.inOut',
            },
            start + 0.04
          ).to(
            scrims[prev],
            {
              autoAlpha: scrimAlpha,
              duration: 0.82,
              ease: 'power2.inOut',
            },
            start + 0.04
          );
        }

        // 3. Previous chapter text exits upward while corresponding new text appears
        if (prevText) {
          tl.to(
            prevText,
            {
              autoAlpha: 0,
              y: -32,
              pointerEvents: 'none',
              duration: 0.36,
              ease: 'power2.in',
            },
            start + 0.08
          );
        }

        if (nextText) {
          const nextItems = nextText.querySelectorAll('[data-text-item]');
          const nextLine = nextText.querySelector('[data-text-line]');

          tl.to(
            nextText,
            {
              autoAlpha: 1,
              y: 0,
              pointerEvents: 'auto',
              duration: 0.48,
              ease: 'power3.out',
            },
            start + 0.36
          ).to(
            nextItems,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.44,
              stagger: 0.06,
              ease: 'power3.out',
            },
            start + 0.38
          );

          if (nextLine) {
            tl.to(
              nextLine,
              {
                scaleX: 1,
                duration: 0.5,
                ease: 'expo.out',
              },
              start + 0.44
            );
          }
        }

        // 4. Background outline chapter number transitions
        if (prevBgNum) {
          tl.to(
            prevBgNum,
            {
              autoAlpha: 0,
              yPercent: -25,
              duration: 0.4,
              ease: 'power2.in',
            },
            start + 0.1
          );
        }
        if (nextBgNum) {
          tl.to(
            nextBgNum,
            {
              autoAlpha: 1,
              yPercent: 0,
              duration: 0.5,
              ease: 'power3.out',
            },
            start + 0.34
          );
        }
      }

      // Final hold so the last stacked chapter can breathe before unpinning
      tl.to({}, { duration: tailHold });
    }, section);

    return () => {
      stRef.current = null;
      ctx.revert();
    };
  }, [chapters, count]);

  const jumpToChapter = (index: number) => {
    const st = stRef.current;
    if (!st || count <= 1) return;
    const progress = index / (count - 1);
    const targetY = st.start + (st.end - st.start) * progress;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  if (!count) return null;

  const totalLabel = String(count).padStart(2, '0');

  return (
    <section
      id="story"
      ref={sectionRef}
      aria-label="Architectural room chapters"
      className="relative h-[100svh] min-h-[680px] w-full overflow-hidden bg-[#070b14] text-[#f4efe6] border-t border-white/[0.06]"
    >
      {/* Subtle atmosphere & grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[10%] top-1/2 -translate-y-1/2 w-[48vw] h-[48vw] max-w-[680px] max-h-[680px] rounded-full bg-[#d1ad7a]/[0.05] blur-[130px]"
      />
      <div className="grain" aria-hidden="true" />

      {/* Giant background outline numeral for active chapter */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute -bottom-8 left-4 md:left-12 lg:left-20 z-0 hidden sm:block"
      >
        <div className="relative h-[22vw] w-[32vw] max-h-[280px]">
          {chapters.map((_, i) => (
            <span
              key={i}
              data-ch-bgnum
              className="text-outline font-display font-light text-[22vw] lg:text-[16vw] leading-none absolute bottom-0 left-0"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
          ))}
        </div>
      </div>

      {/* Main Pinned Stage */}
      <div className="relative z-10 h-full max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20 pt-20 pb-8 md:py-24 flex flex-col justify-between">
        {/* Top editorial bar */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="eyebrow">Spatial Chapters · ঘরের গল্প</div>
          <div className="flex items-center gap-2.5 text-[10.5px] font-mono tracking-[0.24em] uppercase text-slate-400">
            <Layers className="w-3.5 h-3.5 text-[#d1ad7a]" />
            <span>
              Stack <strong className="text-[#f4efe6] font-normal">{String(activeIndex + 1).padStart(2, '0')}</strong> / {totalLabel}
            </span>
          </div>
        </div>

        {/* Split Grid: Left Narrative Text + Right Photo Stack */}
        <div className="my-auto grid lg:grid-cols-12 gap-6 md:gap-10 lg:gap-14 items-center py-2 md:py-4">
          {/* Left Column: Corresponding Chapter Text (orders below stack on mobile, left on desktop) */}
          <div className="lg:col-span-5 order-2 lg:order-1 flex flex-col justify-center">
            <div className="relative min-h-[210px] sm:min-h-[250px] lg:min-h-[340px] flex items-center">
              {chapters.map((ch, i) => {
                const no = String(i + 1).padStart(2, '0');
                return (
                  <article
                    key={i}
                    data-ch-text
                    aria-hidden={activeIndex !== i}
                    className="w-full absolute inset-x-0 top-1/2 -translate-y-1/2"
                  >
                    <div
                      data-text-item
                      className="inline-flex items-center gap-3 text-[10.5px] font-mono tracking-[0.28em] uppercase text-[#d1ad7a] mb-3 md:mb-5"
                    >
                      <span>Chapter {no}</span>
                      <span className="w-6 h-px bg-[#d1ad7a]/60" />
                      <span>{ch.kicker}</span>
                    </div>

                    <h2
                      data-text-item
                      className="font-display font-light text-3xl sm:text-5xl lg:text-[3.5rem] leading-[1.3] sm:leading-[1.34] tracking-normal text-[#f4efe6] py-1 max-w-3xl"
                    >
                      {ch.titleBn}
                    </h2>

                    {ch.titleEn && (
                      <p
                        data-text-item
                        className="mt-2 md:mt-3 text-[11px] font-mono tracking-[0.22em] uppercase text-[#d1ad7a]/80"
                      >
                        {ch.titleEn}
                      </p>
                    )}

                    <div
                      data-text-line
                      className="mt-4 md:mt-6 h-px w-28 bg-gradient-to-r from-[#d1ad7a] via-[#d1ad7a]/50 to-transparent origin-left"
                    />

                    <p
                      data-text-item
                      className="mt-4 md:mt-6 text-sm sm:text-[15px] lg:text-base text-slate-300/90 font-light leading-relaxed max-w-lg"
                    >
                      {ch.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Right Column: The Photo Stack */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            {/* Top padding gives room for previous stacked photos peeking above the active frame */}
            <div className="relative mx-auto w-full max-w-3xl pt-8 sm:pt-12 lg:pt-16">
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] lg:aspect-[4/3]">
                {chapters.map((ch, i) => {
                  const no = String(i + 1).padStart(2, '0');
                  return (
                    <figure
                      key={i}
                      data-stack-card
                      className="absolute inset-0 rounded-2xl overflow-hidden border border-white/15 bg-[#0c1220] shadow-[0_32px_90px_-20px_rgba(0,0,0,0.9)] will-change-transform"
                    >
                      <img
                        data-stack-img
                        src={ch.imageUrl}
                        alt={ch.titleEn || ch.titleBn}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="w-full h-full object-cover will-change-transform"
                      />

                      {/* Subtle top plate rim so stacked edges behind are crisp and legible */}
                      <div className="absolute top-0 inset-x-0 h-9 bg-gradient-to-b from-[#070b14]/80 to-transparent px-4 flex items-center justify-between text-[9.5px] font-mono tracking-[0.24em] uppercase text-[#f4efe6]/80">
                        <span>Plate {no}</span>
                        <span className="text-[#d1ad7a]">{ch.kicker}</span>
                      </div>

                      {/* Bottom editorial vignette + caption */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/85 via-[#070b14]/15 to-transparent pointer-events-none" />

                      <figcaption className="absolute bottom-0 inset-x-0 px-5 sm:px-7 py-4 sm:py-5 flex items-end justify-between gap-4 pointer-events-none">
                        <div>
                          <span className="block text-[9.5px] font-mono tracking-[0.28em] uppercase text-[#d1ad7a]">
                            Chapter {no} · {ch.kicker}
                          </span>
                          <span className="font-display text-lg sm:text-xl text-[#f4efe6] leading-[1.3] inline-block py-0.5">
                            {ch.titleBn}
                          </span>
                        </div>
                        <span className="hidden sm:inline-block text-[10px] font-mono tracking-[0.22em] uppercase text-slate-300/80">
                          {ch.titleEn}
                        </span>
                      </figcaption>

                      {/* Depth scrim that darkens this card as newer cards stack on top of it */}
                      <div
                        data-stack-scrim
                        aria-hidden="true"
                        className="absolute inset-0 bg-[#05080f] pointer-events-none"
                      />
                    </figure>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stack Progress & Chapter Selector */}
        <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            {chapters.map((ch, i) => {
              const no = String(i + 1).padStart(2, '0');
              const isCurrent = activeIndex === i;
              const isStacked = i <= activeIndex;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => jumpToChapter(i)}
                  className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono tracking-[0.2em] uppercase transition-all cursor-pointer shrink-0 ${
                    isCurrent
                      ? 'border-[#d1ad7a] bg-[#d1ad7a]/15 text-[#f1dfbd]'
                      : isStacked
                      ? 'border-white/15 bg-white/[0.03] text-slate-300 hover:border-[#d1ad7a]/50'
                      : 'border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/15'
                  }`}
                >
                  <span className={isCurrent ? 'text-[#d1ad7a]' : 'opacity-60'}>{no}</span>
                  <span className="hidden md:inline">{ch.kicker.replace(/^The\s+/i, '')}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono tracking-[0.26em] uppercase text-slate-500 hidden sm:inline">
              Scroll to stack rooms
            </span>
            <div className="w-full sm:w-36 h-[2px] bg-white/10 rounded-full overflow-hidden">
              <div
                ref={progressFillRef}
                className="h-full w-full origin-left bg-gradient-to-r from-[#d1ad7a] to-[#f1dfbd]"
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
