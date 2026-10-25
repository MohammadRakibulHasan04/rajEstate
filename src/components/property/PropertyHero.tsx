import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowRight, Images, MapPin } from 'lucide-react';
import { Listing, CONSTRUCTION_LABELS } from '../../types/listing';
import { factsByTier, priceLabel, unitStats } from '../../lib/significance';

interface Props {
  listing: Listing;
  onInquire: () => void;
  onGallery: () => void;
}

export const PropertyHero: React.FC<Props> = ({ listing, onInquire, onGallery }) => {
  const rootRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { signature } = factsByTier(listing);
  const stats = listing.kind === 'project' ? unitStats(listing) : null;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const scrub = { trigger: root, start: 'top top', end: 'bottom top', scrub: true };
      if (imgRef.current) gsap.fromTo(imgRef.current, { scale: 1.15, yPercent: 0 }, { scale: 1, yPercent: 14, ease: 'none', scrollTrigger: scrub });
      if (contentRef.current) gsap.to(contentRef.current, { yPercent: -18, autoAlpha: 0.2, ease: 'none', scrollTrigger: scrub });

      const tl = gsap.timeline({ delay: 0.15 });
      tl.from('[data-hero-line]', { yPercent: 115, duration: 1.5, stagger: 0.12, ease: 'expo.out' }).from(
        '[data-hero-fade]',
        { autoAlpha: 0, y: 24, duration: 1.1, stagger: 0.08, ease: 'expo.out' },
        '-=0.9'
      );
    }, root);
    return () => ctx.revert();
  }, [listing.id]);

  return (
    <section ref={rootRef} className="relative h-[100svh] min-h-[640px] w-full overflow-hidden" aria-label="Property overview">
      {listing.media.hero.url && (
        <img
          ref={imgRef}
          src={listing.media.hero.url}
          alt={listing.media.hero.caption || listing.title}
          className="absolute inset-0 w-full h-[120%] object-cover will-change-transform"
          fetchPriority="high"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/45 to-[#070b14]/30" />
      <div className="hero-shade-left" />
      <div className="grain" aria-hidden="true" />

      <div
        ref={contentRef}
        className="absolute inset-0 z-10 flex flex-col justify-end px-6 md:px-12 lg:px-20 pb-16 md:pb-20 max-w-[90rem] mx-auto"
      >
        <div className="eyebrow mb-6" data-hero-fade>
          {CONSTRUCTION_LABELS[listing.construction]} · {listing.location.area}
        </div>

        <h1 className="font-display font-light text-[13vw] sm:text-[9vw] lg:text-[6.4vw] leading-[0.92] tracking-[-0.02em] max-w-[16ch]">
          <span className="reveal-line">
            <span data-hero-line>{listing.titleBn || listing.title}</span>
          </span>
          {listing.taglineBn && (
            <span className="reveal-line text-[0.5em] mt-2">
              <span data-hero-line>
                <em className="italic text-gradient-gold">{listing.taglineBn}</em>
              </span>
            </span>
          )}
        </h1>

        {/* Signature facts inline: the three reasons, stated up front */}
        {signature.length > 0 && (
          <dl className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-px max-w-4xl rounded-2xl overflow-hidden border border-white/10 bg-white/10" data-hero-fade>
            {signature.map((f) => (
              <div key={f.key} className="bg-[#070b14]/70 backdrop-blur-md px-5 py-4">
                <dt className="mono-label">{f.label}</dt>
                <dd className="mt-1.5 font-display text-2xl text-[#f4efe6]">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-10 flex flex-col md:flex-row md:items-end gap-6 md:gap-10" data-hero-fade>
          <div>
            <div className="mono-label mb-2">{listing.kind === 'project' ? 'Homes from' : 'Asking price'}</div>
            <div className="font-display font-light text-4xl md:text-5xl text-gradient-gold">{priceLabel(listing).replace('From ', '')}</div>
            {stats && stats.total > 0 && (
              <div className="mt-2 text-[11px] font-mono tracking-[0.2em] uppercase text-slate-400">
                {stats.available} of {stats.total} homes available
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button id="hero-inquire-btn" onClick={onInquire} className="btn-gold">
              Arrange a visit <ArrowRight className="w-4 h-4" />
            </button>
            {listing.media.gallery.length > 0 && (
              <button id="hero-gallery-btn" onClick={onGallery} className="btn-ghost">
                <Images className="w-4 h-4" /> {listing.media.gallery.length + 1} photos
              </button>
            )}
          </div>
          <div className="md:ml-auto flex items-center gap-2 text-sm text-slate-300">
            <MapPin className="w-4 h-4 text-[#d1ad7a]" />
            {listing.location.areaBn || listing.location.address}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 md:right-12 z-20 hidden md:flex flex-col items-center gap-3" data-hero-fade>
        <div className="scroll-cue" />
      </div>
    </section>
  );
};
