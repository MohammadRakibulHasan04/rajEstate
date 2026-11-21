import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Link, goBack, restorePendingScroll, useDocumentMeta } from '../lib/router';
import { useChildListings, useListingBySlug, useParentListing, usePublishedListings } from '../lib/listings';
import { displayTitle, listingSpecs, priceLabel } from '../lib/significance';
import { isTopLevel, linkedUnit, unitPageMap, withParent } from '../lib/hierarchy';
import { listingPhotos } from '../lib/media';
import { publicSectionId, SECTION_META, visibleSections } from '../lib/sections';
import { Unit } from '../types/listing';

import { PropertyGallery } from '../components/property/PropertyGallery';
import { PropertyHeader } from '../components/property/PropertyHeader';
import { ProjectVideoSection } from '../components/property/ProjectVideoSection';
import { PropertyOverview } from '../components/property/PropertyOverview';
import { PageSection } from '../components/property/PageSection';
import { ListingSectionView } from '../components/property/ListingSectionView';
import { ContactCard } from '../components/property/ContactCard';
import { UnitStack } from '../components/property/UnitStack';
import { Lightbox } from '../components/property/MediaGallery';
import { InquiryPanel } from '../components/property/InquiryPanel';
import { ActionDock } from '../components/property/ActionDock';
import { ListingCard } from '../components/property/ListingCard';
import { ProjectLink, projectHref } from '../components/property/ProjectLink';
import { PropertyLeftbar } from '../components/property/PropertyLeftbar';
import { PropertyMobileHeader } from '../components/property/PropertyMobileHeader';
import logoImg from '../assets/logo.png';

gsap.registerPlugin(ScrollTrigger);

type Viewer = { kind: 'photos' | 'plans' | 'satellite'; index: number } | null;

export const PropertyPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { isAdmin, adminChecking, isPropertySaved, toggleSaveProperty } = useAuth();
  const { listing: raw, loading } = useListingBySlug(slug, isAdmin);
  const { listings: published } = usePublishedListings();

  /* Hierarchy: a unit page reads its project; a project reads its unit pages. */
  const parentId = raw?.parent?.id;
  const { listing: parent, loading: parentLoading } = useParentListing(parentId);
  const familyId = raw ? (raw.kind === 'project' ? raw.id : parentId) : undefined;
  const { listings: family } = useChildListings(familyId, isAdmin);
  const listing = useMemo(() => (raw ? withParent(raw, parent) : null), [raw, parent]);
  const parentProject = parent && parentId ? parent : null;
  const unitPages = useMemo(() => unitPageMap(family), [family]);
  const ownUnit = raw && parent ? linkedUnit(raw, parent) : undefined;
  const initialUnitCode = useMemo(() => new URLSearchParams(window.location.search).get('unit') || undefined, [slug]);

  const photos = useMemo(() => (listing ? listingPhotos(listing) : []), [listing]);
  const specs = useMemo(() => (listing ? listingSpecs(listing, ownUnit?.code) : { primary: [], details: [] }), [listing, ownUnit?.code]);
  const sections = useMemo(() => (listing ? visibleSections(listing).filter((s) => s.type !== 'video') : []), [listing]);

  // Resolve video URL for both single properties and multi-unit projects (falling back to child unit video or published showcase video for demo projects)
  const effectiveVideoUrl = useMemo(() => {
    if (!listing) return '';
    if (listing.media.videoUrl?.trim()) return listing.media.videoUrl.trim();
    if (listing.kind === 'project') {
      const childVideo = family.find((c) => c.media.videoUrl?.trim())?.media.videoUrl?.trim();
      if (childVideo) return childVideo;
      const fallbackVideo = published.find((p) => p.media.videoUrl?.trim())?.media.videoUrl?.trim();
      if (fallbackVideo) return fallbackVideo;
    }
    return '';
  }, [listing, family, published]);

  const listingWithVideo = useMemo(
    () => (listing && effectiveVideoUrl && !listing.media.videoUrl?.trim() ? { ...listing, media: { ...listing.media, videoUrl: effectiveVideoUrl } } : listing),
    [listing, effectiveVideoUrl]
  );
  const hasVideo = !!effectiveVideoUrl;

  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [viewer, setViewer] = useState<Viewer>(null);
  const [prefill, setPrefill] = useState<string>();
  const [copied, setCopied] = useState(false);

  useDocumentMeta(
    listing ? listing.seo?.title || `${displayTitle(listing)} · ${listing.location.area || listing.location.city} | Jonopod Properties` : 'Property | Jonopod Properties',
    listing ? listing.seo?.description || listing.summary.replace(/\s+/g, ' ').slice(0, 158) : undefined
  );

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const isMobile = window.innerWidth < 1024;
    const offset = isMobile ? 64 : 24;
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    goBack(parentProject ? projectHref(parentProject, ownUnit?.code) : '/#showcase');
  }, [parentProject, ownUnit?.code]);

  const enquireUnit = useCallback(
    (u: Unit) => {
      setPrefill(`I'm interested in unit ${u.code} (${u.sizeSqft} sq ft, floor ${u.floor}). Please share availability and the payment schedule.`);
      scrollTo('inquiry');
    },
    [scrollTo]
  );

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: listing ? displayTitle(listing) : undefined, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  };

  /* Navigation items list */
  const hasUnits = listing?.kind === 'project' && listing.units.length > 0;
  const hasOverview = !!listing?.summary.trim() || specs.details.length > 0;

  const navItems = useMemo<[string, string][]>(() => {
    if (!listing) return [];
    return [
      ...(hasVideo ? ([['video', SECTION_META.video.navLabel]] as [string, string][]) : []),
      ...(hasOverview ? ([['overview', 'Overview']] as [string, string][]) : []),
      ...(hasUnits ? ([['plan', 'Units']] as [string, string][]) : []),
      ...(parentProject ? ([['building', 'Project']] as [string, string][]) : []),
      ...sections.map((s): [string, string] => [publicSectionId(s), s.type === 'custom' ? s.title : SECTION_META[s.type].navLabel]),
      ['inquiry', 'Enquire'],
    ];
  }, [listing, hasVideo, hasOverview, hasUnits, parentProject, sections]);

  /* Reading Progress listener */
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Active section scroll spy */
  useEffect(() => {
    const sectionIds = navItems.map(([id]) => id);
    if (!sectionIds.length) return;

    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= maxScroll - 160) {
        setActiveSection(sectionIds[sectionIds.length - 1]);
        return;
      }

      const scrollYWithOffset = window.scrollY + 180;
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollYWithOffset) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [navItems]);

  /* Reveal animations (once content exists) */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !listing) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduced) return;
      gsap.set('[data-reveal]', { autoAlpha: 0, y: 24 });
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 90%',
        once: true,
        onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out', overwrite: true }),
      });
    }, root);
    const t = setTimeout(() => {
      ScrollTrigger.refresh();
      restorePendingScroll();
      if (window.location.hash === '#plan' || initialUnitCode) {
        document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 120);
    return () => {
      clearTimeout(t);
      ctx.revert();
    };
  }, [listing?.id, listing?.updatedAt, initialUnitCode, sections.length]);

  /* ── States ──────────────────────────────────────────────────── */

  if (loading || (parentId && parentLoading) || (adminChecking && !listing)) {
    return (
      <div className="min-h-screen bg-[#ffffff] max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20 pt-24 space-y-6" aria-busy="true">
        <div className="skeleton h-[420px] w-full rounded-2xl" />
        <div className="skeleton h-10 w-2/3 max-w-xl rounded-lg" />
        <div className="skeleton h-5 w-1/3 max-w-sm rounded" />
      </div>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-[#ffffff] text-[#181512] flex flex-col items-center justify-center text-center px-6">
        <span className="text-outline font-display text-[30vw] leading-none select-none" aria-hidden="true">404</span>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.3] max-w-2xl -mt-10 text-[#181512]">Property Not Found</h1>
        <p className="mt-4 text-[#5C5346]">This property may have been sold or is no longer listed.</p>
        <Link to="/" className="btn-gold mt-10">Back to Properties</Link>
      </main>
    );
  }

  const isDraft = listing.publish !== 'published';
  const saved = isPropertySaved(listing.id);
  const related = published.filter((l) => isTopLevel(l) && l.slug !== listing.slug && l.id !== parentId).slice(0, 3);
  const floorPlans = listing.media.floorPlans;
  const sectionTypes = new Set(sections.map((s) => s.type));

  return (
    <div ref={rootRef} className="min-h-screen bg-[#ffffff] text-[#181512] selection:bg-[#9A6B3B]/20 selection:text-[#181512]">
      {/* Top Reading Progress Bar */}
      <div
        className={`fixed ${
          isDraft ? 'top-7' : 'top-0'
        } inset-x-0 lg:left-64 xl:left-72 2xl:left-80 z-[100] h-[2px] bg-[#181512]/[0.06] pointer-events-none`}
      >
        <div
          ref={progressRef}
          className="h-full origin-left bg-gradient-to-r from-[#855B30] via-[#C89B62] to-[#855B30]"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* Admin Draft Banner */}
      {isDraft && (
        <div className="fixed top-0 inset-x-0 z-[105] bg-[#9A6B3B] text-[#ffffff] text-center text-[10.5px] font-mono tracking-[0.22em] uppercase py-1.5 shadow-sm">
          Preview · this listing is {listing.publish} and only visible to admins
        </div>
      )}

      {/* ── Desktop & Laptop: Leftbar (lg and up) ──────────────────── */}
      <PropertyLeftbar
        listing={listing}
        navItems={navItems}
        activeSection={activeSection}
        onNavigate={scrollTo}
        onBack={handleBack}
        isDraft={isDraft}
        isAdmin={isAdmin}
        saved={saved}
        onToggleSave={() => toggleSaveProperty(listing.id)}
        copied={copied}
        onShare={share}
      />

      {/* ── Mobile & Tablet: Header with Animated Burger Menu (< lg) ─ */}
      <PropertyMobileHeader
        listing={listing}
        navItems={navItems}
        activeSection={activeSection}
        onNavigate={scrollTo}
        onBack={handleBack}
        isDraft={isDraft}
        isAdmin={isAdmin}
        saved={saved}
        onToggleSave={() => toggleSaveProperty(listing.id)}
        copied={copied}
        onShare={share}
      />

      {/* ── Main Content Pane: Shifted by leftbar width on lg+ ──────── */}
      <main
        className={`min-w-0 transition-all ${
          isDraft ? 'pt-20 lg:pt-8' : 'pt-14 lg:pt-8'
        } lg:pl-64 xl:pl-72 2xl:pl-80`}
      >
        <div className="max-w-[96rem] mx-auto px-4 sm:px-6 md:px-10 xl:px-14">
          <PropertyGallery
            photos={photos}
            title={displayTitle(listing)}
            onOpen={(index) => setViewer({ kind: 'photos', index })}
            onFloorPlans={sectionTypes.has('floorPlans') ? () => scrollTo('floorPlans') : undefined}
            onVideo={hasVideo ? () => scrollTo('video') : undefined}
            paused={viewer !== null}
          />

          <div className="mt-10 grid lg:grid-cols-12 gap-10 xl:gap-14 pb-20">
            <div className="lg:col-span-8 min-w-0">
              <PropertyHeader listing={listing} parent={parentProject} unit={ownUnit} specs={specs.primary} />

              <div className="lg:hidden mt-8">
                <ContactCard listing={listing} onEnquire={() => scrollTo('inquiry')} />
              </div>

              {hasVideo && listingWithVideo && <ProjectVideoSection listing={listingWithVideo} />}

              <PropertyOverview summary={listing.summary} details={specs.details} />

              {hasUnits && (
                <PageSection id="plan" title="Available Units">
                  <UnitStack listing={listing} onInquireUnit={enquireUnit} unitPages={unitPages} initialUnitCode={initialUnitCode} />
                </PageSection>
              )}

              {parentProject && <ProjectLink project={parentProject} unit={ownUnit} unitPages={unitPages} currentId={listing.id} />}

              {sections.map((s) => (
                <ListingSectionView
                  key={s.id}
                  listing={listing}
                  section={s}
                  onOpenPlan={(index) => setViewer({ kind: 'plans', index })}
                  onOpenSatellite={() => setViewer({ kind: 'satellite', index: 0 })}
                />
              ))}
            </div>

            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-12">
                <ContactCard listing={listing} onEnquire={() => scrollTo('inquiry')} />
              </div>
            </aside>
          </div>
        </div>

        <InquiryPanel listing={listing} prefill={prefill} />

        {related.length > 0 && (
          <section className="py-20 md:py-28 border-t border-[#181512]/[0.08]" aria-labelledby="related-heading">
            <div className="max-w-[96rem] mx-auto px-6 md:px-10 xl:px-14">
              <h2 id="related-heading" className="font-display text-3xl md:text-4xl leading-[1.25] mb-10 text-[#181512]" data-reveal>
                Similar Properties
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

      <footer className="border-t border-[#181512]/10 bg-[#ffffff] px-6 md:px-10 xl:px-14 pt-12 pb-28 lg:pb-12 lg:pl-64 xl:pl-72 2xl:pl-80">
        <div className="max-w-[96rem] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/#showcase" className="group inline-flex items-center gap-3 text-sm text-[#3D362E] hover:text-[#9A6B3B] transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> All Properties
          </Link>
          <img src={logoImg} alt="Jonopod Properties" className="h-8 w-auto object-contain opacity-85" />
          <span lang="bn" className="font-nakkhatra text-base tracking-normal text-[#6E6559]">{priceLabel(listing)}</span>
        </div>
      </footer>

      <ActionDock listing={listing} onInquire={() => scrollTo('inquiry')} />

      {viewer?.kind === 'photos' && photos.length > 0 && (
        <Lightbox images={photos} index={viewer.index} onIndex={(index) => setViewer({ kind: 'photos', index })} onClose={() => setViewer(null)} />
      )}
      {viewer?.kind === 'plans' && floorPlans.length > 0 && (
        <Lightbox images={floorPlans} index={viewer.index} onIndex={(index) => setViewer({ kind: 'plans', index })} onClose={() => setViewer(null)} />
      )}
      {viewer?.kind === 'satellite' && listing.media.satelliteImage?.url && (
        <Lightbox
          images={[listing.media.satelliteImage]}
          index={0}
          onIndex={() => {}}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
};
