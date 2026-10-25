import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, Bookmark, Check, Pencil, Share2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Link, navigate, useDocumentMeta } from '../lib/router';
import { useListingBySlug, usePublishedListings } from '../lib/listings';
import { factsByTier, priceLabel } from '../lib/significance';
import { Unit } from '../types/listing';

import { PropertyHero } from '../components/property/PropertyHero';
import { SignatureFacts } from '../components/property/SignatureFacts';
import { StoryChapters } from '../components/property/StoryChapters';
import { MediaGallery, Lightbox } from '../components/property/MediaGallery';
import { PlanAndFacts } from '../components/property/PlanAndFacts';
import { ProximityRings } from '../components/property/ProximityRings';
import { TrustLedger } from '../components/property/TrustLedger';
import { SpecLedger } from '../components/property/SpecLedger';
import { InquiryPanel } from '../components/property/InquiryPanel';
import { ActionDock } from '../components/property/ActionDock';
import { ListingCard } from '../components/property/ListingCard';

gsap.registerPlugin(ScrollTrigger);

export const PropertyPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { isAdmin, adminChecking, isPropertySaved, toggleSaveProperty } = useAuth();
  const { listing, loading } = useListingBySlug(slug, isAdmin);
  const { listings: published } = usePublishedListings();

  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [navSolid, setNavSolid] = useState(false);
  const [galleryAt, setGalleryAt] = useState<number | null>(null);
  const [planUrl, setPlanUrl] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<string>();
  const [copied, setCopied] = useState(false);

  const tiers = useMemo(() => (listing ? factsByTier(listing) : null), [listing]);

  useDocumentMeta(
    listing ? listing.seo?.title || `${listing.title} · ${listing.location.area} | AURA` : 'Residence | AURA',
    listing ? listing.seo?.description || listing.summary.slice(0, 158) : undefined
  );

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const inquireUnit = useCallback(
    (u: Unit) => {
      setPrefill(`I'm interested in unit ${u.code} (${u.sizeSqft} sq ft, floor ${u.floor}). Please share availability and the payment schedule.`);
      scrollTo('inquiry');
    },
    [scrollTo]
  );

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: listing?.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  };

  /* Nav + progress */
  useEffect(() => {
    const onScroll = () => {
      setNavSolid(window.scrollY > 80);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Scroll choreography (runs once content exists) */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !listing) return;
    const ctx = gsap.context(() => {
      gsap.set('[data-reveal]', { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out', overwrite: true }),
      });

      root.querySelectorAll<HTMLElement>('[data-chapter]').forEach((el) => {
        const img = el.querySelector('[data-ch-img]');
        const fig = el.querySelector('[data-ch-fig]');
        const text = el.querySelector('[data-ch-text]');
        const num = el.querySelector('[data-ch-num]');
        const line = el.querySelector('[data-ch-line]');
        if (img) gsap.fromTo(img, { yPercent: -8, scale: 1.1 }, { yPercent: 8, scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
        if (fig) gsap.fromTo(fig, { clipPath: 'inset(18% 10% 18% 10%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: fig, start: 'top 88%', once: true } });
        if (text) gsap.from(text.children, { y: 50, autoAlpha: 0, duration: 1.3, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: text, start: 'top 85%', once: true } });
        if (num) gsap.fromTo(num, { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
        if (line) gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: line, start: 'top 88%', once: true } });
      });
    }, root);
    const t = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => {
      clearTimeout(t);
      ctx.revert();
    };
  }, [listing?.id, listing?.updatedAt]);

  /* ── States ──────────────────────────────────────────────────── */

  if (loading || (adminChecking && !listing)) {
    return (
      <div className="min-h-screen bg-[#070b14] p-6 md:p-20 flex flex-col justify-end gap-6" aria-busy="true">
        <div className="skeleton h-4 w-48 rounded" />
        <div className="skeleton h-24 w-3/4 max-w-3xl rounded-xl" />
        <div className="skeleton h-16 w-1/2 max-w-xl rounded-xl" />
      </div>
    );
  }

  if (!listing || !tiers) {
    return (
      <main className="min-h-screen bg-[#070b14] text-[#f4efe6] flex flex-col items-center justify-center text-center px-6">
        <span className="text-outline font-display text-[30vw] leading-none select-none" aria-hidden="true">404</span>
        <h1 className="font-display text-4xl md:text-5xl -mt-10">এই ঠিকানাটি খুঁজে পাওয়া যায়নি।</h1>
        <p className="mt-4 text-slate-400">This residence may have been sold or moved.</p>
        <Link to="/" className="btn-gold mt-10">Back to residences</Link>
      </main>
    );
  }

  const isDraft = listing.publish !== 'published';
  const saved = isPropertySaved(listing.id);
  const related = published.filter((l) => l.slug !== listing.slug).slice(0, 3);
  const allImages = listing.media.hero.url ? [listing.media.hero, ...listing.media.gallery] : listing.media.gallery;

  return (
    <div ref={rootRef} className="min-h-screen bg-[#070b14] text-[#f4efe6] selection:bg-cyan-500/30 selection:text-white">
      {/* Progress */}
      <div className="fixed top-0 inset-x-0 z-[100] h-[2px] bg-white/5">
        <div ref={progressRef} className="h-full origin-left bg-gradient-to-r from-[#d1ad7a] via-[#f1dfbd] to-[#d1ad7a]" style={{ transform: 'scaleX(0)' }} />
      </div>

      {isDraft && (
        <div className="fixed top-[2px] inset-x-0 z-[95] bg-[#d1ad7a] text-[#120d07] text-center text-[10.5px] font-mono tracking-[0.22em] uppercase py-1.5">
          Preview · this listing is {listing.publish} and only visible to admins
        </div>
      )}

      {/* Floating nav */}
      <nav
        className={`fixed inset-x-0 z-[90] transition-all duration-700 ${isDraft ? 'top-7' : 'top-0'} ${
          navSolid ? 'bg-[#070b14]/85 backdrop-blur-xl border-b border-white/[0.06] py-3.5' : 'bg-transparent py-6'
        }`}
        aria-label="Property navigation"
      >
        <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20 flex items-center justify-between gap-6">
          <button
            id="property-back"
            onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/'))}
            className="group inline-flex items-center gap-3 text-[11px] font-mono tracking-[0.26em] uppercase text-slate-300 hover:text-[#d1ad7a] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-500" />
            Back
          </button>

          <div className="hidden lg:flex items-center gap-8 text-[10.5px] font-mono tracking-[0.24em] uppercase text-slate-400">
            {[
              ['why', 'Why', tiers.signature.length > 0],
              ['gallery', 'Rooms', listing.media.gallery.length > 0],
              ['plan', listing.kind === 'project' ? 'Homes' : 'Plan', true],
              ['neighbourhood', 'Area', listing.nearby.length > 0],
              ['specification', 'Details', true],
            ]
              .filter(([, , show]) => show)
              .map(([id, label]) => (
                <button key={id as string} onClick={() => scrollTo(id as string)} className="hover:text-[#f4efe6] transition-colors cursor-pointer">
                  {label}
                </button>
              ))}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to={`/manage/edit/${listing.id}`} id="property-edit" className="btn-quiet !py-2.5 !px-3.5" aria-label="Edit listing">
                <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Edit</span>
              </Link>
            )}
            <button id="property-share" onClick={share} className="p-2.5 rounded-full border border-white/15 text-slate-300 hover:text-white hover:border-[#d1ad7a]/60 transition-colors cursor-pointer" aria-label="Share">
              {copied ? <Check className="w-4 h-4 text-[#d1ad7a]" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              id="property-save"
              onClick={() => toggleSaveProperty(listing.id)}
              className={`p-2.5 rounded-full border transition-colors cursor-pointer ${saved ? 'border-[#d1ad7a] text-[#d1ad7a] bg-[#d1ad7a]/10' : 'border-white/15 text-slate-300 hover:text-white hover:border-[#d1ad7a]/60'}`}
              aria-label={saved ? 'Remove from saved' : 'Save this home'}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      <main>
        <PropertyHero listing={listing} onInquire={() => scrollTo('inquiry')} onGallery={() => setGalleryAt(0)} />
        <SignatureFacts facts={tiers.signature} summary={listing.summary} />
        <StoryChapters chapters={listing.chapters} />
        <MediaGallery hero={listing.media.hero} images={listing.media.gallery} openAt={galleryAt} setOpenAt={setGalleryAt} />
        <PlanAndFacts listing={listing} facts={tiers.defining} onInquireUnit={inquireUnit} onOpenPlan={setPlanUrl} />
        <ProximityRings listing={listing} />
        <TrustLedger listing={listing} />
        <SpecLedger listing={listing} facts={tiers.all} />
        <InquiryPanel listing={listing} prefill={prefill} />

        {related.length > 0 && (
          <section className="relative py-28 md:py-36 border-t border-white/[0.06]" aria-labelledby="related-heading">
            <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
              <div className="eyebrow mb-7" data-reveal>More residences</div>
              <h2 id="related-heading" className="font-display font-light text-4xl md:text-6xl leading-[0.95] mb-14" data-reveal>
                আরও কিছু <em className="italic text-gradient-gold">ঠিকানা।</em>
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {related.map((l, i) => (
                  <div key={l.id} data-reveal>
                    <ListingCard listing={l} index={i} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-white/10 bg-[#05080f] px-6 md:px-12 lg:px-20 pt-14 pb-28">
        <div className="max-w-[90rem] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="group inline-flex items-center gap-3 text-sm text-slate-300 hover:text-[#d1ad7a] transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-500" /> All residences
          </Link>
          <span aria-hidden="true" className="font-display font-light text-6xl tracking-[0.04em] text-transparent bg-clip-text bg-gradient-to-b from-white/[0.14] to-white/0 select-none">
            AURA
          </span>
          <span className="text-[10px] font-mono tracking-[0.26em] uppercase text-slate-500">{priceLabel(listing)}</span>
        </div>
      </footer>

      <ActionDock listing={listing} onInquire={() => scrollTo('inquiry')} />

      {planUrl && (
        <Lightbox
          images={[...listing.media.floorPlans]}
          index={Math.max(0, listing.media.floorPlans.findIndex((p) => p.url === planUrl))}
          onIndex={(i) => setPlanUrl(listing.media.floorPlans[i]?.url ?? null)}
          onClose={() => setPlanUrl(null)}
        />
      )}
      {/* Gallery lightbox is rendered inside MediaGallery; this handles the hero button when gallery is short */}
      {galleryAt !== null && listing.media.gallery.length === 0 && allImages.length > 0 && (
        <Lightbox images={allImages} index={galleryAt} onIndex={setGalleryAt} onClose={() => setGalleryAt(null)} />
      )}
    </div>
  );
};
