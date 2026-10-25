import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { frameUrl } from '../../lib/frames';

gsap.registerPlugin(ScrollTrigger);

interface ParallaxQuoteBandProps {
  onBook: () => void;
}

/**
 * Full-bleed golden-hour image moving slower than the page, with the
 * quote and a floating card moving faster: classic multi-plane parallax.
 */
export const ParallaxQuoteBand: React.FC<ParallaxQuoteBandProps> = ({ onBook }) => {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const st = { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true };

      gsap.fromTo(root.querySelector('[data-bg]'), { yPercent: -14, scale: 1.12 }, { yPercent: 14, scale: 1, ease: 'none', scrollTrigger: st });
      gsap.fromTo(root.querySelector('[data-quote]'), { y: 120 }, { y: -80, ease: 'none', scrollTrigger: st });
      gsap.fromTo(root.querySelector('[data-card]'), { y: 220 }, { y: -160, ease: 'none', scrollTrigger: st });

      gsap.from(root.querySelectorAll('[data-q-line]'), {
        yPercent: 110,
        duration: 1.5,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: root, start: 'top 60%', once: true },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      aria-label="Featured residence"
      className="relative h-[115vh] min-h-[720px] overflow-hidden bg-[#070b14] text-[#f4efe6]"
    >
      <div data-bg className="absolute inset-0 will-change-transform">
        <img
          src={frameUrl(37)}
          alt="Finished modern residence with infinity pool and olive trees at golden hour"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b14] via-[#070b14]/20 to-[#070b14]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/80 via-[#070b14]/20 to-transparent" />
      <div className="grain" aria-hidden="true" />

      <div className="relative h-full max-w-7xl mx-auto px-6 md:px-12 lg:px-20 flex items-center">
        <blockquote data-quote className="max-w-3xl">
          <div className="eyebrow mb-8">On Architecture</div>
          <p className="font-display font-light text-5xl sm:text-6xl lg:text-[5.2rem] leading-[1] tracking-[-0.02em]">
            <span className="reveal-line"><span data-q-line>&ldquo;Architecture is</span></span>
            <span className="reveal-line"><span data-q-line>the <em className="italic text-gradient-gold">thoughtful making</em></span></span>
            <span className="reveal-line"><span data-q-line>of space.&rdquo;</span></span>
          </p>
          <footer className="mt-8 text-[11px] font-mono tracking-[0.3em] uppercase text-slate-300">Louis I. Kahn</footer>
        </blockquote>

        <div
          data-card
          className="hidden lg:block absolute right-12 xl:right-20 bottom-[18%] w-80 rounded-2xl border border-white/15 bg-[#070b14]/45 backdrop-blur-xl p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.28em] uppercase text-[#d1ad7a]">
            <span>Featured</span>
            <span className="text-slate-400">N°07</span>
          </div>
          <h3 className="mt-4 font-display text-3xl leading-tight">The Olive Grove Residence</h3>
          <p className="mt-2 text-sm text-slate-300/80 font-light">Luberon, Provence · 5 bed · 6,450 sq ft</p>
          <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-between">
            <span className="font-display text-2xl">€8.9M</span>
            <button
              id="quote-band-book-btn"
              onClick={onBook}
              className="group inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.24em] uppercase text-[#f4efe6] hover:text-[#d1ad7a] transition-colors cursor-pointer"
            >
              Private viewing
              <ArrowUpRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
