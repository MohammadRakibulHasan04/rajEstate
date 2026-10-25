import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { frameUrl } from '../../lib/frames';

gsap.registerPlugin(ScrollTrigger);

interface Figure {
  frame: number;
  caption: string;
  aspect: string;
}

/** Three columns, each travelling at its own speed to create depth. */
const COLUMNS: { speed: number; offset: string; figures: Figure[] }[] = [
  {
    speed: 8,
    offset: 'md:mt-0',
    figures: [
      { frame: 1, caption: 'Schematic massing', aspect: 'aspect-[4/5]' },
      { frame: 18, caption: 'Slab & glazing line', aspect: 'aspect-[4/3]' },
    ],
  },
  {
    speed: 22,
    offset: 'md:mt-40',
    figures: [
      { frame: 10, caption: 'Dimensioned elevation', aspect: 'aspect-[3/4]' },
      { frame: 30, caption: 'Material study, dusk', aspect: 'aspect-[4/5]' },
    ],
  },
  {
    speed: 13,
    offset: 'md:mt-16',
    figures: [
      { frame: 25, caption: 'Roof plane installation', aspect: 'aspect-[4/5]' },
      { frame: 37, caption: 'The residence, golden hour', aspect: 'aspect-square' },
    ],
  },
];

const MARQUEE = ['নকশা', 'ভিত্তি', 'উপকরণ', 'বাড়ি'];

export const ParallaxGallery: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Column-level parallax only where there is room for it
      mm.add('(min-width: 768px)', () => {
        root.querySelectorAll<HTMLElement>('[data-col]').forEach((col) => {
          const speed = Number(col.dataset.speed);
          gsap.fromTo(
            col,
            { yPercent: speed / 2 },
            {
              yPercent: -speed,
              ease: 'none',
              scrollTrigger: { trigger: root.querySelector('[data-grid]'), start: 'top bottom', end: 'bottom top', scrub: true },
            }
          );
        });
      });

      // Image-in-frame parallax (works everywhere)
      root.querySelectorAll<HTMLElement>('[data-fig]').forEach((fig) => {
        const img = fig.querySelector('img');
        gsap.fromTo(
          img,
          { yPercent: -8, scale: 1.08 },
          {
            yPercent: 8,
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
          }
        );
        // Clip-path reveal on entry
        gsap.fromTo(
          fig,
          { clipPath: 'inset(18% 10% 18% 10%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.6,
            ease: 'expo.out',
            scrollTrigger: { trigger: fig, start: 'top 90%', once: true },
          }
        );
      });

      // Heading lines
      gsap.from(root.querySelectorAll('[data-head-line]'), {
        yPercent: 110,
        duration: 1.4,
        stagger: 0.12,
        ease: 'expo.out',
        scrollTrigger: { trigger: root, start: 'top 75%', once: true },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="process"
      ref={rootRef}
      className="relative overflow-hidden bg-[#070b14] text-[#f4efe6] pt-28 md:pt-36"
    >
      <div className="hairline max-w-7xl mx-auto mb-24" />

      <div className="relative px-6 md:px-12 lg:px-20 max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-end">
        <div className="lg:col-span-7">
          <div className="eyebrow mb-7">The Process</div>
          <h2 className="font-display font-light text-5xl sm:text-6xl lg:text-[5.5rem] leading-[0.95] tracking-[-0.02em]">
            <span className="reveal-line">
              <span data-head-line>প্রথম রেখা থেকে</span>
            </span>
            <span className="reveal-line">
              <span data-head-line>
                <em className="italic text-gradient-gold">দিনের শেষ আলো।</em>
              </span>
            </span>
          </h2>
        </div>
        <p className="lg:col-span-4 lg:col-start-9 text-[15px] text-slate-400 font-light leading-relaxed">
          আমাদের প্রতিটি বাড়ির সাথেই থাকে তার সম্পূর্ণ নকশার আর্কাইভ: ড্রয়িং, গঠনতন্ত্র এবং উপকরণের নমুনা। আপনি শুধু একটি বাড়ি কেনেন না; আপনি এর গল্পের অংশীদার হন।
        </p>
      </div>

      <div
        data-grid
        className="relative px-6 md:px-12 lg:px-20 max-w-7xl mx-auto mt-20 md:mt-28 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pb-10 md:pb-40"
      >
        {COLUMNS.map((col, ci) => (
          <div key={ci} data-col data-speed={col.speed} className={`flex flex-col gap-6 md:gap-8 will-change-transform ${col.offset}`}>
            {col.figures.map((f) => (
              <figure key={f.frame} className="group">
                <div data-fig className={`parallax-figure ${f.aspect}`}>
                  <img src={frameUrl(f.frame)} alt={f.caption} loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/60 via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity duration-700" />
                </div>
                <figcaption className="mt-4 flex items-baseline justify-between text-[10px] font-mono tracking-[0.26em] uppercase">
                  <span className="text-slate-300">{f.caption}</span>
                  <span className="text-[#d1ad7a]">Fig. {String(f.frame).padStart(2, '0')}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>

      {/* Marquee band */}
      <div className="relative border-y border-white/10 py-8 md:py-10 overflow-hidden" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center">
              {[...MARQUEE, ...MARQUEE].map((w, i) => (
                <span key={`${dup}-${i}`} className="flex items-center">
                  <span
                    className={`font-display font-light text-6xl md:text-8xl px-8 md:px-12 whitespace-nowrap ${
                      i % 2 === 0 ? 'italic text-[#f4efe6]' : 'text-outline'
                    }`}
                  >
                    {w}
                  </span>
                  <span className="w-2.5 h-2.5 rotate-45 bg-[#d1ad7a]/80" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
