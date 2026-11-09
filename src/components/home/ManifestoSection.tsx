import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STATEMENT =
  'আমরা তথ্য, মূল্য ও প্রক্রিয়া, সবকিছু পরিষ্কার রাখার চেষ্টা করি, যাতে কোনো ধাপে আপনাকে অন্ধকারে থাকতে না হয়';

const HIGHLIGHT = new Set(['রচনা', 'করা', 'হয়:', 'আলো,', 'প্রকৃতি', 'জীবন']);

export const ManifestoSection: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // Words light up as the reader scrolls through them
      gsap.fromTo(
        root.querySelectorAll('[data-word]'),
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: 'none',
          scrollTrigger: {
            trigger: root.querySelector('[data-statement]'),
            start: 'top 78%',
            end: 'bottom 45%',
            scrub: 0.6,
          },
        }
      );

      // Parallax background numeral
      gsap.fromTo(
        root.querySelector('[data-bg-word]'),
        { xPercent: 8 },
        {
          xPercent: -18,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="manifesto"
      ref={rootRef}
      className="relative overflow-hidden bg-[#070b14] text-[#f4efe6] px-6 md:px-12 lg:px-20 pt-32 pb-28 md:pt-44 md:pb-36"
    >
      <span
        data-bg-word
        aria-hidden="true"
        className="text-outline pointer-events-none absolute top-10 left-0 whitespace-nowrap font-display font-light italic text-[26vw] leading-none select-none"
      >
        Philosophy
      </span>

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-3">
          <div className="eyebrow">Our Philosophy</div>
          <p className="mt-6 text-sm text-slate-400 font-light leading-relaxed max-w-xs">
            Transparency and documented Process
          </p>
        </div>

        <p
          data-statement
          className="lg:col-span-9 font-display font-light text-[2.15rem] sm:text-5xl lg:text-[4.1rem] leading-[1.32] sm:leading-[1.38] lg:leading-[1.42] tracking-normal py-1.5 w-full max-w-5xl"
        >
          {STATEMENT.split(' ').map((w, i) => (
            <React.Fragment key={i}>
              <span data-word className={HIGHLIGHT.has(w) ? 'italic text-[#d1ad7a]' : ''}>
                {w}
              </span>{' '}
            </React.Fragment>
          ))}
        </p>
      </div>
    </section>
  );
};
