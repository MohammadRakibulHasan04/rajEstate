import React from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { Listing, CATEGORY_LABELS, CONSTRUCTION_LABELS } from '../../types/listing';
import { Link } from '../../lib/router';
import { factsByTier, priceLabel, unitStats } from '../../lib/significance';

interface ListingCardProps {
  listing: Listing;
  index?: number;
  size?: 'large' | 'normal';
}

/**
 * Editorial card. Instead of a crowded beds/baths/sqft row it surfaces
 * the single most important fact and the reason it matters.
 */
export const ListingCard: React.FC<ListingCardProps> = ({ listing, index = 0, size = 'normal' }) => {
  const { signature, defining } = factsByTier(listing);
  const lead = signature[0] ?? defining[0];
  const stats = listing.kind === 'project' ? unitStats(listing) : null;

  return (
    <Link
      to={`/property/${listing.slug}`}
      id={`listing-card-${listing.slug}`}
      className="group block"
      aria-label={`${listing.title}, ${listing.location.area}`}
    >
      <figure className={`parallax-figure ${size === 'large' ? 'aspect-[16/11]' : 'aspect-[4/5]'} rounded-2xl`}>
        {listing.media.hero.url ? (
          <img
            src={listing.media.hero.url}
            alt={listing.media.hero.caption || listing.title}
            loading="lazy"
            decoding="async"
            className="!inset-0 !h-full transition-transform duration-[1.6s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 skeleton" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/25 to-transparent" />

        <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
          <span className="text-outline font-display text-6xl leading-none select-none" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="px-3 py-1.5 rounded-full panel-glass text-[9.5px] font-mono tracking-[0.22em] uppercase text-[#f1dfbd]">
            {listing.kind === 'project' ? 'Project' : CATEGORY_LABELS[listing.category]} · {CONSTRUCTION_LABELS[listing.construction]}
          </span>
        </div>

        <div className="absolute inset-x-5 bottom-5">
          {lead && (
            <div className="mb-4 max-w-sm translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
              <div className="mono-label !text-[#d1ad7a]">{lead.label} · {lead.value}</div>
              {lead.why && <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300 line-clamp-2">{lead.why}</p>}
            </div>
          )}
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-display font-light text-3xl md:text-4xl leading-[1.02] text-[#f4efe6] truncate">
                {listing.titleBn || listing.title}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-mono tracking-[0.18em] uppercase text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-[#d1ad7a]" />
                <span className="truncate">{listing.location.area || listing.location.city}</span>
              </div>
            </div>
            <span className="shrink-0 w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-[#f4efe6] group-hover:bg-[#d1ad7a] group-hover:border-[#d1ad7a] group-hover:text-[#120d07] transition-all duration-500">
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500" />
            </span>
          </div>
        </div>
      </figure>

      <figcaption className="mt-4 flex items-baseline justify-between gap-4 text-[10.5px] font-mono tracking-[0.22em] uppercase">
        <span className="text-slate-300 truncate">{listing.title}</span>
        <span className="text-gradient-gold shrink-0">
          {priceLabel(listing)}
          {stats && stats.total > 0 && <span className="text-slate-500"> · {stats.available} left</span>}
        </span>
      </figcaption>
    </Link>
  );
};
