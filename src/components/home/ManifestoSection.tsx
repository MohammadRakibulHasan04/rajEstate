import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STATEMENT =
  'আমরা বিশ্বাস করি একটি দুর্দান্ত বাড়ি কেবল তৈরি করা হয় না। এটি রচনা করা হয়: প্রতিটি রেখায়, প্রতিটি উপাদানে, যতক্ষণ না আলো, প্রকৃতি এবং জীবন একত্রে এর মধ্য দিয়ে প্রবাহিত হয়।';

const HIGHLIGHT = new Set(['রচনা', 'করা', 'হয়:', 'আলো,', 'প্রকৃতি', 'জীবন']);

const STATS = [
  { value: 145, suffix: 'M', prefix: '$', label: 'Portfolio under advisory' },
  { value: 38, suffix: '', prefix: '', label: 'Architect partners worldwide' },
  { value: 12, suffix: '', prefix: '', label: 'Countries represented' },
  { value: 98, suffix: '%', prefix: '', label: 'Client referral rate' },
];

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

      // Counters
      root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 2.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toString();
          },
        });
      });

      gsap.from(root.querySelectorAll('[data-stat]'), {
        y: 40,
        opacity: 0,
        duration: 1.2,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: root.querySelector('[data-stats]'), start: 'top 85%', once: true },
      });
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
            একটি স্বাধীন প্রতিষ্ঠান, যা রুচিশীল ক্রেতাদের সাথে প্রকৃত স্থাপত্যিক গুণাবলী সম্পন্ন বাড়ির মেলবন্ধন ঘটায়।
          </p>
        </div>

        <p
          data-statement
          className="lg:col-span-9 font-display font-light text-[2.15rem] sm:text-5xl lg:text-[4.1rem] leading-[1.08] tracking-[-0.015em]"
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

      <div data-stats className="relative max-w-7xl mx-auto mt-24 md:mt-32 grid grid-cols-2 lg:grid-cols-4 border-t border-white/10">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            data-stat
            className={`py-10 pr-6 border-white/10 ${i % 2 === 1 ? 'pl-6 border-l' : ''} ${i >= 2 ? 'border-t lg:border-t-0' : ''} ${i > 0 ? 'lg:pl-10 lg:border-l' : ''}`}
          >
            <div className="font-display font-light text-6xl md:text-7xl leading-none tabular-nums">
              <span className="text-[#d1ad7a] text-4xl md:text-5xl align-top">{s.prefix}</span>
              <span data-count={s.value}>0</span>
              <span className="text-[#d1ad7a] text-4xl md:text-5xl">{s.suffix}</span>
            </div>
            <div className="mt-4 text-[10px] font-mono tracking-[0.28em] uppercase text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
