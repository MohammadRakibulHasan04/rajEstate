import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bath,
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Images,
  Layers,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  Play,
} from 'lucide-react';
import { Listing, MediaImage, Unit, UnitStatus, CONSTRUCTION_LABELS } from '../../types/listing';
import { factsByTier, priceLabel, unitStats } from '../../lib/significance';
import { Link } from '../../lib/router';
import { projectHref } from './ProjectLink';
import { telHref, waHref } from './InquiryPanel';

const STATUS_LABEL: Record<UnitStatus, string> = { available: 'Available', booked: 'Booked', sold: 'Sold' };

interface Props {
  listing: Listing;
  parent?: Listing | null;
  unit?: Unit;
  onInquire: () => void;
  onGallery: (index?: number) => void;
  onOpenPlan?: (url: string) => void;
}

export const PropertyHero: React.FC<Props> = ({
  listing,
  parent,
  unit,
  onInquire,
  onGallery,
  onOpenPlan,
}) => {
  const { signature } = factsByTier(listing);
  const stats = listing.kind === 'project' ? unitStats(listing) : null;

  // Assemble all unique property photos in display order
  const photos = useMemo<MediaImage[]>(() => {
    const list: MediaImage[] = [];
    const seen = new Set<string>();
    const push = (img: MediaImage) => {
      if (!img?.url || seen.has(img.url)) return;
      seen.add(img.url);
      list.push(img);
    };

    if (listing.media.hero?.url) {
      push({
        ...listing.media.hero,
        room: listing.media.hero.room || 'Exterior',
      });
    }
    listing.media.gallery.forEach((img) => push(img));
    listing.chapters.forEach((ch) => {
      if (ch.imageUrl) {
        push({
          url: ch.imageUrl,
          room: ch.kicker.replace(/^The\s+/i, ''),
          caption: ch.titleEn,
          captionBn: ch.titleBn,
        });
      }
    });

    return list;
  }, [listing.media.hero, listing.media.gallery, listing.chapters]);

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
  }, [listing.id]);

  const totalPhotos = photos.length;
  const safeIdx = totalPhotos > 0 ? activeIdx % totalPhotos : 0;
  const activePhoto = photos[safeIdx];

  const handlePrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (totalPhotos <= 1) return;
      setActiveIdx((prev) => (prev - 1 + totalPhotos) % totalPhotos);
    },
    [totalPhotos]
  );

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (totalPhotos <= 1) return;
      setActiveIdx((prev) => (prev + 1) % totalPhotos);
    },
    [totalPhotos]
  );

  const primaryPlan = listing.media.floorPlans[0];
  const hasFloorPlan = Boolean(primaryPlan?.url);

  // Build the 3 stacked right-column slots:
  // If a floor plan exists, top 2 slots are upcoming/distinct photos and the 3rd slot is the Floor Plan.
  // Otherwise, all 3 slots are upcoming/distinct photos.
  const sidePhotoSlots = useMemo(() => {
    if (totalPhotos <= 1) return [];
    const count = hasFloorPlan ? Math.min(2, totalPhotos - 1) : Math.min(3, totalPhotos - 1);
    const items: { photo: MediaImage; index: number }[] = [];
    for (let offset = 1; offset <= count; offset++) {
      const idx = (safeIdx + offset) % totalPhotos;
      items.push({ photo: photos[idx], index: idx });
    }
    return items;
  }, [photos, totalPhotos, safeIdx, hasFloorPlan]);

  // Core architectural specs for the quick-glance bar
  const quickSpecs = useMemo(() => {
    const items: { icon: React.ReactNode; label: string; value: string }[] = [];
    if (listing.core.beds) {
      items.push({
        icon: <BedDouble className="w-4 h-4 text-[#d1ad7a]" />,
        label: 'Bedrooms',
        value: `${listing.core.beds} Beds`,
      });
    }
    if (listing.core.baths) {
      items.push({
        icon: <Bath className="w-4 h-4 text-[#d1ad7a]" />,
        label: 'Bathrooms',
        value: `${listing.core.baths} Baths`,
      });
    }
    if (listing.core.sizeSqft) {
      items.push({
        icon: <Maximize2 className="w-4 h-4 text-[#d1ad7a]" />,
        label: 'Area',
        value: `${listing.core.sizeSqft.toLocaleString()} sq ft`,
      });
    }
    if (listing.core.facing) {
      items.push({
        icon: <Compass className="w-4 h-4 text-[#d1ad7a]" />,
        label: 'Orientation',
        value: listing.core.facing,
      });
    }
    return items;
  }, [listing.core]);

  const handleOpenPlan = () => {
    if (primaryPlan?.url && onOpenPlan) {
      onOpenPlan(primaryPlan.url);
    } else {
      document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-20 md:pt-22 pb-10 md:pb-14 w-full" aria-label="Property overview">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 md:px-12 lg:px-20">
        {/* ── 1. TOP BENTO PHOTO SHOWCASE ─────────────────────────────── */}
        {totalPhotos > 0 && (
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#05080f] shadow-[0_28px_80px_-20px_rgba(0,0,0,0.85)]">
            <div
              className={`grid grid-cols-1 ${
                sidePhotoSlots.length > 0 || hasFloorPlan ? 'md:grid-cols-12' : ''
              } md:grid-rows-1 gap-1.5 md:gap-2 md:h-[380px] lg:h-[420px] xl:h-[450px]`}
            >
              {/* Left Primary Stage */}
              <div
                onClick={() => onGallery(safeIdx)}
                className={`${
                  sidePhotoSlots.length > 0 || hasFloorPlan ? 'md:col-span-9' : 'md:col-span-12'
                } relative h-[250px] sm:h-[330px] md:h-full min-h-0 overflow-hidden bg-[#0c1220] group cursor-zoom-in select-none`}
              >
                {activePhoto && (
                  <img
                    key={activePhoto.url}
                    src={activePhoto.url}
                    alt={activePhoto.caption || activePhoto.room || listing.title}
                    fetchPriority="high"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                  />
                )}

                {/* Subtle top & bottom gradients for control legibility */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20" />

                {/* Active photo room / caption pill (top-left) */}
                {(activePhoto?.room || activePhoto?.caption) && (
                  <div className="pointer-events-none absolute top-4 left-4 z-10 px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[11px] font-mono tracking-[0.2em] uppercase text-[#f4efe6]">
                    {activePhoto.room || activePhoto.caption}
                  </div>
                )}

                {/* Left & Right Carousel Navigation Arrows — locked to fixed stage center */}
                {totalPhotos > 1 && (
                  <>
                    <button
                      type="button"
                      id="hero-photo-prev"
                      onClick={handlePrev}
                      aria-label="Previous photo"
                      className="absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/15 hover:border-[#d1ad7a]/70 text-white flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5 shrink-0" />
                    </button>
                    <button
                      type="button"
                      id="hero-photo-next"
                      onClick={handleNext}
                      aria-label="Next photo"
                      className="absolute right-3.5 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/15 hover:border-[#d1ad7a]/70 text-white flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5 shrink-0" />
                    </button>
                  </>
                )}

                {/* Bottom-Left Overlay Action Pills */}
                <div
                  className="absolute bottom-3.5 sm:bottom-5 left-3.5 sm:left-5 z-10 flex flex-wrap items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    id="hero-gallery-btn"
                    onClick={() => onGallery(safeIdx)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15 hover:border-[#d1ad7a]/60 text-xs sm:text-[13px] font-medium text-white transition-all cursor-pointer shadow-md"
                  >
                    <Images className="w-4 h-4 text-[#d1ad7a]" />
                    <span>All photos</span>
                  </button>

                  {hasFloorPlan && (
                    <button
                      type="button"
                      id="hero-floorplan-pill"
                      onClick={handleOpenPlan}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15 hover:border-[#d1ad7a]/60 text-xs sm:text-[13px] font-medium text-white transition-all cursor-pointer shadow-md"
                    >
                      <Layers className="w-4 h-4 text-[#d1ad7a]" />
                      <span>Floor plan</span>
                    </button>
                  )}

                  {listing.media.videoUrl && (
                    <a
                      href={listing.media.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15 hover:border-[#d1ad7a]/60 text-xs sm:text-[13px] font-medium text-white transition-all cursor-pointer shadow-md"
                    >
                      <Play className="w-4 h-4 text-[#d1ad7a]" />
                      <span>Video tour</span>
                    </a>
                  )}
                </div>

                {/* Bottom-Right Counter Badge (e.g. 2/36) */}
                <div className="pointer-events-none absolute bottom-3.5 sm:bottom-5 right-3.5 sm:right-5 z-10 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-xs sm:text-[13px] font-mono tracking-wider text-white font-medium shadow-md">
                  {safeIdx + 1}/{totalPhotos}
                </div>
              </div>

              {/* Right Stacked Column (3 Thumbnail Slots) */}
              {(sidePhotoSlots.length > 0 || hasFloorPlan) && (
                <div
                  className={`md:col-span-3 min-h-0 grid ${
                    sidePhotoSlots.length + (hasFloorPlan ? 1 : 0) === 3
                      ? 'grid-cols-3 md:grid-cols-1 md:grid-rows-3'
                      : sidePhotoSlots.length + (hasFloorPlan ? 1 : 0) === 2
                      ? 'grid-cols-2 md:grid-cols-1 md:grid-rows-2'
                      : 'grid-cols-1 md:grid-rows-1'
                  } gap-1.5 md:gap-2 h-24 sm:h-28 md:h-full`}
                >
                  {sidePhotoSlots.map(({ photo, index }, slotIdx) => {
                    const isLastWithoutPlan =
                      !hasFloorPlan && slotIdx === sidePhotoSlots.length - 1 && totalPhotos > 4;
                    return (
                      <button
                        key={photo.url + index}
                        type="button"
                        onClick={() => setActiveIdx(index)}
                        className="relative w-full h-full min-h-0 overflow-hidden bg-[#0c1220] group text-left cursor-pointer focus:outline-none"
                        aria-label={`View ${photo.room || photo.caption || `photo ${index + 1}`}`}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || photo.room || `Photo ${index + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent group-hover:from-black/65 transition-colors" />
                        <span className="pointer-events-none absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-[13px] font-medium text-white tracking-wide truncate drop-shadow">
                            {photo.room || photo.caption || `Photo ${index + 1}`}
                          </span>
                          {isLastWithoutPlan && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onGallery(index);
                              }}
                              className="pointer-events-auto px-2 py-0.5 rounded-full bg-black/70 border border-white/15 text-[10px] font-mono text-[#d1ad7a] hover:border-[#d1ad7a]"
                            >
                              +{totalPhotos - 3}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}

                  {/* Bottom Slot: Floor Plan Preview (when available) */}
                  {hasFloorPlan && primaryPlan && (
                    <button
                      type="button"
                      id="hero-floorplan-card"
                      onClick={handleOpenPlan}
                      className="relative w-full h-full min-h-0 overflow-hidden bg-[#f5f2eb] group text-left cursor-pointer focus:outline-none"
                      aria-label="Open floor plan"
                    >
                      <img
                        src={primaryPlan.url}
                        alt={primaryPlan.caption || 'Floor plan'}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-contain p-2 sm:p-3 transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                      <span className="pointer-events-none absolute bottom-2.5 left-3 text-xs sm:text-[13px] font-medium text-white tracking-wide drop-shadow">
                        Floor plan
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 2. MODERN SPLIT HEADER BELOW THE PHOTO GRID ────────────── */}
        <div className="mt-8 md:mt-11 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Title, Location, Key Specs & Signature Highlights */}
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="eyebrow">
                {CONSTRUCTION_LABELS[listing.construction]} · {listing.location.area}
              </div>
              {parent && (
                <Link
                  to={projectHref(parent, unit?.code)}
                  id="hero-project-pill"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full panel-glass text-[10px] font-mono tracking-[0.22em] uppercase text-[#f1dfbd] hover:border-[#d1ad7a] transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#d1ad7a]" />
                  <span>Part of {parent.titleBn || parent.title}</span>
                  {unit && <span className="text-[#d1ad7a]">· Unit {unit.code}</span>}
                  <ArrowUpRight className="w-3 h-3 text-[#d1ad7a]" />
                </Link>
              )}
              {unit && (
                <span
                  className={`px-3 py-1 rounded-full text-[9.5px] font-mono tracking-[0.2em] uppercase border ${
                    unit.status === 'available'
                      ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
                      : unit.status === 'booked'
                      ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                      : 'border-white/15 bg-white/5 text-slate-400'
                  }`}
                >
                  {STATUS_LABEL[unit.status]}
                </span>
              )}
            </div>

            <h1 className="font-display font-light text-4xl sm:text-5xl lg:text-[3.6rem] leading-[1.24] tracking-normal text-[#f4efe6] py-0.5">
              {listing.titleBn || listing.title}
            </h1>

            {listing.taglineBn && (
              <p className="mt-2 font-display text-xl sm:text-2xl italic text-gradient-gold leading-[1.35]">
                {listing.taglineBn}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#d1ad7a] shrink-0" />
                <span>
                  {listing.location.areaBn
                    ? `${listing.location.areaBn} · ${listing.location.address}`
                    : listing.location.address}
                </span>
              </span>
            </div>

            {/* Quick Architectural Specs Strip */}
            {quickSpecs.length > 0 && (
              <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickSpecs.map((spec) => (
                  <div
                    key={spec.label}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#d1ad7a]/10 border border-[#d1ad7a]/25 flex items-center justify-center shrink-0">
                      {spec.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9.5px] font-mono tracking-[0.22em] uppercase text-slate-400">
                        {spec.label}
                      </div>
                      <div className="mt-0.5 font-display text-lg text-[#f4efe6] truncate">
                        {spec.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Signature Facts Strip (when any distinct signature facts exist) */}
            {signature.length > 0 && (
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-px rounded-2xl overflow-hidden border border-white/10 bg-white/10">
                {signature.map((f) => (
                  <div key={f.key} className="bg-[#070b14]/90 px-5 py-4">
                    <dt className="mono-label">{f.label}</dt>
                    <dd className="mt-1 font-display text-2xl text-[#f4efe6]">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Right Column: Price & Primary CTA Card */}
          <div className="lg:col-span-4 w-full">
            <div className="panel p-6 sm:p-7 border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="mono-label">
                  {listing.kind === 'project' ? 'Homes from' : 'Asking price'}
                </span>
                {listing.price.negotiable && listing.kind !== 'project' && (
                  <span className="px-2.5 py-0.5 rounded-full border border-[#d1ad7a]/40 bg-[#d1ad7a]/10 text-[9.5px] font-mono tracking-[0.2em] uppercase text-[#f1dfbd]">
                    Negotiable
                  </span>
                )}
              </div>

              <div className="font-display font-light text-4xl sm:text-5xl text-gradient-gold leading-tight">
                {priceLabel(listing).replace('From ', '')}
              </div>

              {stats && stats.total > 0 && (
                <div className="mt-2 text-[11px] font-mono tracking-[0.2em] uppercase text-slate-400">
                  {stats.available} of {stats.total} homes available
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  id="hero-inquire-btn"
                  onClick={onInquire}
                  className="btn-gold w-full justify-center"
                >
                  Arrange a visit <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    id="hero-phone-btn"
                    href={
                      listing.contact.phone || listing.contact.whatsapp
                        ? telHref(listing.contact.phone || listing.contact.whatsapp || '')
                        : '#inquiry'
                    }
                    className="btn-quiet justify-center !py-3"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#d1ad7a]" />
                    <span>Phone</span>
                  </a>
                  <a
                    id="hero-whatsapp-btn"
                    href={
                      listing.contact.whatsapp || listing.contact.phone
                        ? waHref(
                            listing.contact.whatsapp || listing.contact.phone || '',
                            `Hello, I'm interested in ${listing.title} (${window.location.href}).`
                          )
                        : '#inquiry'
                    }
                    target={listing.contact.whatsapp || listing.contact.phone ? '_blank' : undefined}
                    rel={listing.contact.whatsapp || listing.contact.phone ? 'noopener noreferrer' : undefined}
                    className="btn-quiet justify-center !py-3"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#d1ad7a]" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
