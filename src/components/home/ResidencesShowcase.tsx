import React, { useState, useMemo, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Compass, Layers } from 'lucide-react';
import { usePublishedListings } from '../../lib/listings';
import { isTopLevel, withParent } from '../../lib/hierarchy';
import { ListingCard } from '../property/ListingCard';
import { CATEGORY_LABELS } from '../../types/listing';

gsap.registerPlugin(ScrollTrigger);

const DESKTOP_BREAKPOINT = 1024;

function getMobileStackMetrics(viewportWidth: number) {
  if (viewportWidth < 640) {
    return { baseTop: 74, peekStep: 14, maxPeekLevels: 5, scaleStep: 0.038, yStep: 3 };
  }
  return { baseTop: 88, peekStep: 18, maxPeekLevels: 5, scaleStep: 0.042, yStep: 3.5 };
}

function getDesktopHorizontalMetrics(viewportWidth: number, stageWidth: number) {
  const isXl = viewportWidth >= 1280;
  const cardW = isXl ? 450 : 410;
  const gap = isXl ? 36 : 28;
  const peekStepX = isXl ? 84 : 72;
  const maxPeekLevels = 6;
  const stickyTop = isXl ? 104 : 96;
  const leadHold = isXl ? 280 : 240;
  const stepScroll = isXl ? 480 : 430;
  const tailHold = isXl ? 160 : 140;
  const scaleStep = 0.045;
  return {
    cardW: Math.min(cardW, Math.max(340, stageWidth - 32)),
    gap,
    peekStepX,
    maxPeekLevels,
    stickyTop,
    leadHold,
    stepScroll,
    tailHold,
    scaleStep,
  };
}

export const ResidencesShowcase: React.FC = () => {
  const { listings: rawListings, loading } = usePublishedListings();
  const [filter, setFilter] = useState<string>('all');
  const [activeCardIdx, setActiveCardIdx] = useState<number>(0);
  const activeCardIdxRef = useRef<number>(0);

  const sectionRef = useRef<HTMLElement>(null);
  const stackContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardSlotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardInnerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardDimRefs = useRef<(HTMLDivElement | null)[]>([]);

  const listings = useMemo(() => {
    const byId = new Map(rawListings.map((l) => [l.id, l]));
    return rawListings
      .filter((l) => isTopLevel(l) || l.featured)
      .map((l) => (l.parent ? withParent(l, byId.get(l.parent.id)) : l));
  }, [rawListings]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => set.add(l.category));
    return Array.from(set);
  }, [listings]);

  const filtered = useMemo(() => {
    if (filter === 'all') return listings;
    if (filter === 'projects') return listings.filter((l) => l.kind === 'project');
    return listings.filter((l) => l.category === filter);
  }, [listings, filter]);

  // Reset active card index on filter change
  useEffect(() => {
    activeCardIdxRef.current = 0;
    setActiveCardIdx(0);
  }, [filter]);

  // Smooth jump to a specific card in the stack (works for both horizontal desktop and vertical mobile)
  const scrollToCard = useCallback(
    (targetIdx: number) => {
      const stackEl = stackContainerRef.current;
      const stageEl = stageRef.current;
      const slots = cardSlotRefs.current.filter(Boolean) as HTMLDivElement[];
      if (!stackEl || !slots[targetIdx]) return;

      const vw = window.innerWidth;
      const stackDocTop = stackEl.getBoundingClientRect().top + window.scrollY;

      if (vw >= DESKTOP_BREAKPOINT) {
        const stageW = stageEl?.clientWidth || stackEl.clientWidth || vw;
        const { stickyTop, leadHold, stepScroll } = getDesktopHorizontalMetrics(vw, stageW);
        const holdOffset = targetIdx > 0 ? leadHold : 0;
        const targetScrollY = stackDocTop - stickyTop + holdOffset + targetIdx * stepScroll;
        window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'smooth' });
        return;
      }

      const { baseTop, peekStep, maxPeekLevels } = getMobileStackMetrics(vw);
      const stickyTop = baseTop + Math.min(targetIdx, maxPeekLevels) * peekStep;

      let flowOffsetTop = 0;
      for (let i = 0; i < targetIdx; i++) {
        const el = slots[i];
        if (!el) continue;
        const style = window.getComputedStyle(el);
        const mb = parseFloat(style.marginBottom || '0') || 0;
        flowOffsetTop += el.offsetHeight + mb;
      }

      const targetScrollY = stackDocTop + flowOffsetTop - stickyTop;
      window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'smooth' });
    },
    []
  );

  // Scroll-driven stacking choreography: Horizontal on laptop/desktop (>= 1024px), Vertical on mobile (< 1024px)
  useLayoutEffect(() => {
    const stackEl = stackContainerRef.current;
    const stageEl = stageRef.current;
    if (!stackEl || !stageEl || loading || filtered.length === 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count = filtered.length;

    cardSlotRefs.current = cardSlotRefs.current.slice(0, count);
    cardInnerRefs.current = cardInnerRefs.current.slice(0, count);
    cardDimRefs.current = cardDimRefs.current.slice(0, count);

    let measuredCardH = 480;

    const configureDOMForViewport = () => {
      const vw = window.innerWidth;
      const isDesktop = vw >= DESKTOP_BREAKPOINT;

      if (isDesktop) {
        const stageW = stageEl.clientWidth || stackEl.clientWidth || vw;
        const { cardW, stickyTop, leadHold, stepScroll, tailHold } = getDesktopHorizontalMetrics(
          vw,
          stageW
        );

        // Temporarily set width on first slot to measure natural card height accurately
        const firstSlot = cardSlotRefs.current[0];
        if (firstSlot) {
          firstSlot.style.width = `${cardW}px`;
          const firstInner = cardInnerRefs.current[0];
          const h = firstInner?.offsetHeight || firstSlot.offsetHeight;
          if (h > 200) measuredCardH = h;
        }

        const totalRunwayH =
          count > 1
            ? measuredCardH + leadHold + (count - 1) * stepScroll + tailHold
            : measuredCardH;

        stackEl.style.height = `${totalRunwayH}px`;
        stackEl.style.maxWidth = '100%';

        stageEl.style.position = 'sticky';
        stageEl.style.top = `${stickyTop}px`;
        stageEl.style.height = `${measuredCardH}px`;
        stageEl.style.width = '100%';

        for (let i = 0; i < count; i++) {
          const slot = cardSlotRefs.current[i];
          const inner = cardInnerRefs.current[i];
          if (slot) {
            slot.style.position = 'absolute';
            slot.style.top = '0px';
            slot.style.left = '0px';
            slot.style.width = `${cardW}px`;
            slot.style.marginBottom = '0px';
            slot.style.zIndex = String(10 + i);
          }
          if (inner) {
            inner.style.transformOrigin = 'left center';
          }
        }
      } else {
        // Mobile & Tablet (< 1024px): keep vertical sticky stacking as-is
        const { baseTop, peekStep, maxPeekLevels } = getMobileStackMetrics(vw);

        stackEl.style.height = 'auto';
        stackEl.style.maxWidth = '540px';

        stageEl.style.position = 'static';
        stageEl.style.top = 'auto';
        stageEl.style.height = 'auto';
        stageEl.style.width = '100%';

        for (let i = 0; i < count; i++) {
          const slot = cardSlotRefs.current[i];
          const inner = cardInnerRefs.current[i];
          if (slot) {
            slot.style.position = 'sticky';
            slot.style.top = `${baseTop + Math.min(i, maxPeekLevels) * peekStep}px`;
            slot.style.left = 'auto';
            slot.style.width = '100%';
            slot.style.marginBottom = '';
            slot.style.zIndex = String(10 + i);
          }
          if (inner) {
            inner.style.transformOrigin = 'top center';
          }
        }
      }
    };

    configureDOMForViewport();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        stackEl,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.65, ease: 'expo.out', overwrite: 'auto' }
      );

      const isTouch = window.innerWidth < 768;
      const dur = isTouch ? 0.16 : 0.24;

      const xTo = cardInnerRefs.current.map((el) =>
        el ? gsap.quickTo(el, 'x', { duration: dur, ease: 'power3.out' }) : null
      );
      const yTo = cardInnerRefs.current.map((el) =>
        el ? gsap.quickTo(el, 'y', { duration: dur, ease: 'power3.out' }) : null
      );
      const scaleTo = cardInnerRefs.current.map((el) =>
        el ? gsap.quickTo(el, 'scale', { duration: dur, ease: 'power3.out' }) : null
      );
      const dimTo = cardDimRefs.current.map((el) =>
        el ? gsap.quickTo(el, 'opacity', { duration: dur, ease: 'power2.out' }) : null
      );

      const updateStack = (instant = false) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const isDesktop = vw >= DESKTOP_BREAKPOINT;

        /* ──────────────────────────────────────────────────────────────
           LAPTOP & BIGGER SCREENS (>= 1024px): HORIZONTAL STACKING
        ─────────────────────────────────────────────────────────────── */
        if (isDesktop) {
          const stageW = stageEl.clientWidth || stackEl.clientWidth || vw;
          const {
            cardW,
            gap,
            peekStepX,
            maxPeekLevels,
            stickyTop,
            leadHold,
            stepScroll,
            scaleStep,
          } = getDesktopHorizontalMetrics(vw, stageW);

          const stackRect = stackEl.getBoundingClientRect();
          const totalTravel = Math.max(1, (count - 1) * stepScroll);
          // Wait for leadHold pixels of scroll after pinning before starting the horizontal stack
          const scrolledPastPin = Math.max(0, stickyTop - stackRect.top - leadHold);
          const overallProgress =
            count > 1 ? Math.max(0, Math.min(1, scrolledPastPin / totalTravel)) : 0;

          // Continuous timeline t in [0, count - 1]
          const totalT = overallProgress * Math.max(0, count - 1);

          // Arrival progress p[k] in [0, 1] for each card k >= 1
          const arrivalProgress = new Array<number>(count).fill(0);
          arrivalProgress[0] = 1;
          let currentFrontIdx = 0;

          for (let k = 1; k < count; k++) {
            const stepLocal = Math.max(0, Math.min(1, totalT - (k - 1)));
            // Hold briefly at the start of each step before gliding over the previous card
            const delayedP = Math.max(0, Math.min(1, (stepLocal - 0.14) / 0.86));
            arrivalProgress[k] = 1 - Math.pow(1 - delayedP, 2.2);
            if (delayedP > 0.42) {
              currentFrontIdx = k;
            }
          }

          if (currentFrontIdx !== activeCardIdxRef.current) {
            activeCardIdxRef.current = currentFrontIdx;
            setActiveCardIdx(currentFrontIdx);
          }

          // Smoothly center the horizontal stage from initial pair to final stacked deck
          const initialSpan =
            count === 1 ? cardW : Math.min(stageW - 32, 2 * cardW + gap);
          const startBaseX = Math.max(16, (stageW - initialSpan) / 2);
          const finalDeckW =
            cardW + Math.min(count - 1, maxPeekLevels) * peekStepX;
          const endBaseX = Math.max(16, (stageW - finalDeckW) / 2);
          const baseX = startBaseX + (endBaseX - startBaseX) * overallProgress;

          const slideDistance = Math.max(120, cardW + gap - peekStepX);

          for (let j = 0; j < count; j++) {
            // How many cards after j have stacked on top of card j
            let depth = 0;
            for (let m = j + 1; m < count; m++) {
              depth += arrivalProgress[m];
            }

            // Horizontal position X_j(t) = anchorX(j) + sum_{k=1..j} (1 - p[k]) * slideDistance
            const anchorX = baseX + Math.min(j, maxPeekLevels) * peekStepX;
            let unstackedOffset = 0;
            for (let k = 1; k <= j; k++) {
              unstackedOffset += (1 - arrivalProgress[k]) * slideDistance;
            }

            const targetX = reducedMotion
              ? anchorX
              : anchorX + unstackedOffset - Math.min(depth, 4) * 4;
            const targetScale = reducedMotion
              ? 1
              : Math.max(0.84, 1 - depth * scaleStep);
            const targetDim = reducedMotion
              ? 0
              : Math.min(0.32, depth * 0.11);

            const inner = cardInnerRefs.current[j];
            const dim = cardDimRefs.current[j];

            if (instant) {
              if (inner) {
                gsap.set(inner, {
                  x: targetX,
                  y: 0,
                  scale: targetScale,
                  force3D: true,
                });
              }
              if (dim) gsap.set(dim, { opacity: targetDim });
            } else {
              xTo[j]?.(targetX);
              yTo[j]?.(0);
              scaleTo[j]?.(targetScale);
              dimTo[j]?.(targetDim);
            }
          }
          return;
        }

        /* ──────────────────────────────────────────────────────────────
           MOBILE & TABLET (< 1024px): VERTICAL STACKING (AS-IS)
        ─────────────────────────────────────────────────────────────── */
        if (reducedMotion || count <= 1) {
          for (let i = 0; i < count; i++) {
            const inner = cardInnerRefs.current[i];
            const dim = cardDimRefs.current[i];
            if (inner) gsap.set(inner, { x: 0, y: 0, scale: 1, force3D: true });
            if (dim) gsap.set(dim, { opacity: 0 });
          }
          return;
        }

        const { baseTop, peekStep, maxPeekLevels, scaleStep, yStep } =
          getMobileStackMetrics(vw);

        const arrivalProgress = new Array<number>(count).fill(0);
        const entranceProgress = new Array<number>(count).fill(1);
        let currentFrontIdx = 0;

        for (let j = 0; j < count; j++) {
          const slot = cardSlotRefs.current[j];
          if (!slot) continue;
          const rect = slot.getBoundingClientRect();
          const stickyTop = baseTop + Math.min(j, maxPeekLevels) * peekStep;
          const cardH = Math.max(320, rect.height);
          // Wait until the incoming card has climbed partway over the previous card before shrinking it
          const travelDist = Math.max(180, cardH * 0.62);

          if (j > 0) {
            const rawP = (stickyTop + travelDist - rect.top) / travelDist;
            const clamped = Math.max(0, Math.min(1, rawP));
            arrivalProgress[j] = 1 - Math.pow(1 - clamped, 2);

            if (clamped > 0.42) {
              currentFrontIdx = j;
            }

            const enterDist = Math.max(180, vh - stickyTop);
            const rawEnter = (vh + 40 - rect.top) / enterDist;
            const clampedEnter = Math.max(0, Math.min(1, rawEnter));
            entranceProgress[j] = 1 - Math.pow(1 - clampedEnter, 2.2);
          }
        }

        if (currentFrontIdx !== activeCardIdxRef.current) {
          activeCardIdxRef.current = currentFrontIdx;
          setActiveCardIdx(currentFrontIdx);
        }

        for (let i = 0; i < count; i++) {
          let depth = 0;
          for (let j = i + 1; j < count; j++) {
            depth += arrivalProgress[j];
          }

          const enterScale = i === 0 ? 1 : 0.968 + 0.032 * entranceProgress[i];
          const buriedScale = Math.max(0.84, 1 - depth * scaleStep);
          const targetScale = enterScale * buriedScale;
          const targetY = -Math.min(depth, 4.5) * yStep;
          const targetDim = Math.min(0.32, depth * 0.11);

          const inner = cardInnerRefs.current[i];
          const dim = cardDimRefs.current[i];

          if (instant) {
            if (inner) {
              gsap.set(inner, {
                x: 0,
                y: targetY,
                scale: targetScale,
                force3D: true,
              });
            }
            if (dim) gsap.set(dim, { opacity: targetDim });
          } else {
            xTo[i]?.(0);
            yTo[i]?.(targetY);
            scaleTo[i]?.(targetScale);
            dimTo[i]?.(targetDim);
          }
        }
      };

      updateStack(true);

      const trigger = ScrollTrigger.create({
        trigger: stackEl,
        start: 'top bottom',
        end: 'bottom top',
        invalidateOnRefresh: true,
        onUpdate: () => updateStack(false),
        onRefresh: () => {
          configureDOMForViewport();
          updateStack(true);
        },
      });

      const onResize = () => {
        configureDOMForViewport();
        updateStack(true);
        ScrollTrigger.refresh();
      };
      window.addEventListener('resize', onResize, { passive: true });

      return () => {
        window.removeEventListener('resize', onResize);
        trigger.kill();
      };
    }, stackEl);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [filtered, loading]);

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="relative overflow-x-clip bg-[#ffffff] text-[#181512] border-t border-[#181512]/[0.07] pt-24 pb-20 md:pt-36 md:pb-28"
    >
      {/* Decorative background watermark wrapped in its own overflow-hidden layer so sticky works */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="text-outline absolute top-10 left-0 whitespace-nowrap font-display font-light italic text-[18vw] leading-none select-none opacity-60">
          Residences
        </span>
      </div>

      <div className="relative max-w-[86rem] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 space-y-10 sm:space-y-14">
        {/* Editorial Heading Strip */}
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-end" data-reveal>
          <div className="lg:col-span-10 max-w-4xl">
            <div className="eyebrow mb-4 sm:mb-6">Curated Portfolio</div>
            <h2 className="font-display font-light text-4xl sm:text-6xl lg:text-7xl leading-[1.28] sm:leading-[1.34] lg:leading-[1.38] tracking-normal py-1 text-[#181512]">
              লিস্টেড{' '}
              <em className="italic text-gradient-gold">রেসিডেন্স</em>
            </h2>
          </div>
        </div>

        {/* Filter Pills & Stack Index Bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 border-b border-[#181512]/10 pb-5"
          data-reveal
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`chip cursor-pointer ${
                filter === 'all'
                  ? '!border-[#9A6B3B] !bg-[#9A6B3B]/15 !text-[#5C3D1E] font-medium'
                  : ''
              }`}
            >
              All Residences ({listings.length})
            </button>

            {listings.some((l) => l.kind === 'project') && (
              <button
                onClick={() => setFilter('projects')}
                className={`chip cursor-pointer ${
                  filter === 'projects'
                    ? '!border-[#9A6B3B] !bg-[#9A6B3B]/15 !text-[#5C3D1E] font-medium'
                    : ''
                }`}
              >
                Multi-Unit Projects
              </button>
            )}

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`chip cursor-pointer ${
                  filter === cat
                    ? '!border-[#9A6B3B] !bg-[#9A6B3B]/15 !text-[#5C3D1E] font-medium'
                    : ''
                }`}
              >
                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {filtered.length > 1 && (
              <div
                className="inline-flex items-center gap-1 p-1 rounded-full bg-[#F8F5EE] border border-[#181512]/10"
                role="navigation"
                aria-label="Residence stack navigation"
              >
                <span className="inline-flex items-center gap-1 px-2 text-[9.5px] font-mono tracking-[0.18em] uppercase text-[#786F63]">
                  <Layers className="w-3 h-3 text-[#9A6B3B]" />
                  <span className="hidden sm:inline">Stack</span>
                </span>
                {filtered.map((item, idx) => {
                  const isCurrent = activeCardIdx === idx;
                  return (
                    <button
                      key={item.id || item.slug}
                      type="button"
                      onClick={() => scrollToCard(idx)}
                      title={`Jump to ${item.title}`}
                      className={`w-6 h-6 rounded-full font-mono text-[10px] font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? 'bg-[#181512] text-[#FAF7F2] shadow-xs'
                          : 'text-[#6E6559] hover:text-[#181512] hover:bg-[#181512]/[0.06]'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            )}

            <span className="mono-label hidden md:inline text-[#786F63]">
              Showing {filtered.length} of {listings.length} residences
            </span>
          </div>
        </div>

        {/* Stacking Residences Deck (Horizontal on lg+, Vertical on <lg) */}
        {loading ? (
          <div className="space-y-8 lg:space-y-0 lg:flex lg:justify-center lg:gap-8 max-w-[540px] lg:max-w-none mx-auto">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-[420px] sm:h-[460px] lg:w-[440px] rounded-[28px] skeleton"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="panel p-16 text-center space-y-4">
            <Compass className="w-10 h-10 text-[#9A6B3B] mx-auto" />
            <h3 className="font-display text-2xl text-[#181512]">No residences found</h3>
            <p className="text-sm text-[#6E6559] max-w-sm mx-auto">
              No properties matched the selected typology filter.
            </p>
          </div>
        ) : (
          <div
            ref={stackContainerRef}
            className="relative mx-auto pt-2 pb-4 sm:pb-8"
          >
            <div ref={stageRef} className="relative w-full">
              {filtered.map((listing, index) => {
                const isLast = index === filtered.length - 1;
                return (
                  <div
                    key={listing.id || listing.slug}
                    ref={(el) => {
                      cardSlotRefs.current[index] = el;
                    }}
                    style={{
                      zIndex: 10 + index,
                    }}
                    className={`will-change-transform ${
                      isLast ? 'mb-0' : 'mb-28 sm:mb-36 md:mb-44 lg:mb-0'
                    }`}
                  >
                    <div
                      ref={(el) => {
                        cardInnerRefs.current[index] = el;
                      }}
                      className="relative will-change-transform"
                    >
                      <ListingCard
                        listing={listing}
                        index={index}
                        total={filtered.length}
                        variant="stack"
                        isActive={activeCardIdx === index}
                      />
                      {/* Ambient Depth Dimming Overlay as Subsequent Cards Stack Over This Card */}
                      <div
                        ref={(el) => {
                          cardDimRefs.current[index] = el;
                        }}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-30 rounded-[28px] sm:rounded-[32px] bg-[#181512] opacity-0"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
