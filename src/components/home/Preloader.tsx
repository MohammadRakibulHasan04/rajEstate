import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface PreloaderProps {
  progress: number; // 0..1
  loaded: boolean;
  onComplete: () => void;
}

/**
 * Full-screen intro curtain shown while the hero frames are decoded.
 * Counts up, then lifts away like a drafting sheet being pulled off.
 */
export const Preloader: React.FC<PreloaderProps> = ({ progress, loaded, onComplete }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const display = useRef({ value: 0 });
  const exited = useRef(false);

  // Smoothly animate the displayed counter toward the real progress.
  useEffect(() => {
    const tween = gsap.to(display.current, {
      value: progress * 100,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        const v = Math.round(display.current.value);
        if (counterRef.current) counterRef.current.textContent = String(v).padStart(3, '0');
        if (barRef.current) barRef.current.style.transform = `scaleX(${display.current.value / 100})`;
      },
    });
    return () => {
      tween.kill();
    };
  }, [progress]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!loaded || exited.current || !rootRef.current) return;
    exited.current = true;
    const root = rootRef.current;

    const tl = gsap.timeline({
      delay: 0.5,
      onComplete: () => {
        document.body.style.overflow = '';
        onComplete();
      },
    });

    tl.to(root.querySelectorAll('[data-pl-fade]'), {
      opacity: 0,
      y: -20,
      duration: 0.6,
      stagger: 0.05,
      ease: 'power2.in',
    })
      .to(root.querySelector('[data-pl-word]'), { yPercent: -110, duration: 0.8, ease: 'expo.in' }, '<')
      .to(root, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.25')
      .set(root, { display: 'none' });
  }, [loaded, onComplete]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] bg-[#070b14] text-[#f4efe6] flex flex-col justify-between px-6 md:px-12 py-8 md:py-10 overflow-hidden"
      aria-busy={!loaded}
      aria-label="Loading AURA"
    >
      <div className="hero-grid opacity-60" />
      <div className="grain" />

      <div className="relative flex items-center justify-between text-[10px] font-mono tracking-[0.32em] uppercase text-slate-400" data-pl-fade>
        <span>AURA · Architectural Residences</span>
        <span className="hidden sm:inline">Est. MMXXVI</span>
      </div>

      <div className="relative flex flex-col items-center text-center">
        <span className="reveal-line">
          <span data-pl-word className="font-display font-light text-[18vw] md:text-[11rem] leading-none tracking-[0.04em]">
            AURA
          </span>
        </span>
        <span className="mt-4 font-display italic text-lg md:text-xl text-slate-400" data-pl-fade>
          Drafting your residence&hellip;
        </span>
      </div>

      <div className="relative" data-pl-fade>
        <div className="flex items-end justify-between mb-4">
          <span className="text-[10px] font-mono tracking-[0.32em] uppercase text-slate-500">Blueprint → Reality</span>
          <span className="font-display font-light text-5xl md:text-7xl tabular-nums leading-none">
            <span ref={counterRef}>000</span>
            <span className="text-[#d1ad7a] text-2xl md:text-3xl align-top ml-1">%</span>
          </span>
        </div>
        <div className="h-px w-full bg-white/10 overflow-hidden">
          <div ref={barRef} className="h-full w-full origin-left bg-gradient-to-r from-[#8fc3ff] via-[#d1ad7a] to-[#f1dfbd]" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
    </div>
  );
};
