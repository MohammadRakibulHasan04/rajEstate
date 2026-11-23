import React, { useMemo } from 'react';
import { Bath, BedDouble, Fence, MapPin } from 'lucide-react';
import { Listing, CATEGORY_LABELS } from '../../types/listing';
import { Link } from '../../lib/router';
import { priceLabel, sizeRange } from '../../lib/significance';
import { formatNumber } from '../../lib/format';

export interface ListingCardProps {
  listing: Listing;
  index?: number;
  total?: number;
  size?: 'large' | 'normal';
  variant?: 'stack' | 'grid';
  isActive?: boolean;
}

function getCardMetrics(listing: Listing) {
  const c = listing.core;
  const units = listing.units || [];

  // 1. Beds
  let bedsLabel = '— beds';
  if (typeof c.beds === 'number' && c.beds > 0) {
    bedsLabel = `${c.beds} ${c.beds === 1 ? 'bed' : 'beds'}`;
  } else if (units.length > 0) {
    const vals = Array.from(new Set(units.map((u) => u.beds).filter((v) => v > 0))).sort((a, b) => a - b);
    if (vals.length === 1) bedsLabel = `${vals[0]} ${vals[0] === 1 ? 'bed' : 'beds'}`;
    else if (vals.length > 1) bedsLabel = `${vals[0]}–${vals[vals.length - 1]} beds`;
  }

  // 2. Baths
  let bathsLabel = '— baths';
  if (typeof c.baths === 'number' && c.baths > 0) {
    bathsLabel = `${c.baths} ${c.baths === 1 ? 'bath' : 'baths'}`;
  } else if (units.length > 0) {
    const vals = Array.from(new Set(units.map((u) => u.baths).filter((v) => v > 0))).sort((a, b) => a - b);
    if (vals.length === 1) bathsLabel = `${vals[0]} ${vals[0] === 1 ? 'bath' : 'baths'}`;
    else if (vals.length > 1) bathsLabel = `${vals[0]}–${vals[vals.length - 1]} baths`;
  }

  // 3. Balcony
  let balconyLabel = '— balcony';
  if (typeof c.balconies === 'number' && c.balconies > 0) {
    balconyLabel = `${c.balconies} ${c.balconies === 1 ? 'balcony' : 'balconies'}`;
  } else if (units.length > 0) {
    const vals = Array.from(new Set(units.map((u) => u.balconies).filter((v) => v > 0))).sort((a, b) => a - b);
    if (vals.length === 1) balconyLabel = `${vals[0]} ${vals[0] === 1 ? 'balcony' : 'balconies'}`;
    else if (vals.length > 1) balconyLabel = `${vals[0]}–${vals[vals.length - 1]} balconies`;
  }

  // 4. Sqft
  let sqftLabel = '— sqft';
  const range = sizeRange(listing);
  if (range) {
    sqftLabel =
      range.min === range.max
        ? `${formatNumber(range.min)} sqft`
        : `${formatNumber(range.min)}–${formatNumber(range.max)} sqft`;
  } else if (c.landKatha) {
    sqftLabel = `${c.landKatha} katha`;
  }

  return { bedsLabel, bathsLabel, balconyLabel, sqftLabel };
}

/**
 * Minimal, professional property card modeled after the reference design:
 * - Top-right corner cutout notch labeled with Property Type
 * - Price displayed as the primary title
 * - Location with map pin
 * - Bed, Bath, Balcony, and Sqft metrics
 * - Bottom-right corner cutout notch with "View Details" CTA
 */
export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  variant = 'grid',
}) => {
  const priceTitle = useMemo(() => priceLabel(listing), [listing]);
  const propertyTypeLabel = CATEGORY_LABELS[listing.category] || 'Property';
  const locationText =
    [listing.location.area, listing.location.city].filter(Boolean).join(', ') ||
    listing.location.address ||
    'Dhaka';

  const { bedsLabel, bathsLabel, balconyLabel, sqftLabel } = useMemo(
    () => getCardMetrics(listing),
    [listing]
  );

  const heroUrl = listing.media.hero?.url || listing.media.gallery?.[0]?.url || '';
  const isStack = variant === 'stack';

  return (
    <Link
      to={`/property/${listing.slug}`}
      id={`listing-card-${listing.slug}`}
      aria-label={`${priceTitle}, ${locationText}`}
      className={`group relative block w-full bg-[#F4F1EC] rounded-[28px] sm:rounded-[32px] p-1.5 border border-[#181512]/[0.08] shadow-[0_22px_55px_-16px_rgba(24,21,18,0.16),0_4px_16px_-4px_rgba(24,21,18,0.06)] hover:shadow-[0_28px_65px_-16px_rgba(154,107,59,0.24)] transition-all duration-500 select-none overflow-hidden ${
        isStack
          ? 'max-w-[390px] sm:max-w-[440px] md:max-w-[500px] lg:max-w-[540px] mx-auto'
          : ''
      }`}
    >
      {/* Main White Card Body */}
      <div className="relative bg-[#FFFFFF] rounded-[24px] sm:rounded-[27px] p-3.5 sm:p-4 md:p-5 flex flex-col">
        {/* ── 1. PHOTO FRAME WITH TOP-RIGHT PROPERTY TYPE CUTOUT NOTCH ── */}
        <div
          className={`relative w-full overflow-hidden rounded-[18px] sm:rounded-[22px] bg-[#E8E2D7] shrink-0 ${
            isStack
              ? 'h-[205px] sm:h-[235px] md:h-[260px] lg:h-[275px]'
              : 'aspect-[16/11]'
          }`}
        >
          {heroUrl ? (
            <img
              data-card-img
              src={heroUrl}
              alt={listing.media.hero?.caption || listing.title || priceTitle}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
            />
          ) : (
            <div className="absolute inset-0 skeleton" />
          )}

          {/* Top-Right Stepped Cutout Notch for Property Type */}
          <div className="absolute top-0 right-0 z-10 bg-[#FFFFFF] pl-2.5 pb-2 rounded-bl-[18px] sm:rounded-bl-[20px]">
            {/* Left concave corner fillet along top edge */}
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="pointer-events-none absolute top-0 -left-4 sm:-left-5 w-4 h-4 sm:w-5 sm:h-5 fill-[#FFFFFF]"
            >
              <path d="M20 0H0C11.0457 0 20 8.9543 20 20V0Z" />
            </svg>

            {/* Bottom concave corner fillet along right edge */}
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="pointer-events-none absolute -bottom-4 sm:-bottom-5 right-0 w-4 h-4 sm:w-5 sm:h-5 fill-[#FFFFFF]"
            >
              <path d="M20 0H0C11.0457 0 20 8.9543 20 20V0Z" />
            </svg>

            {/* Property Type Pill Badge */}
            <span className="inline-flex items-center justify-center px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full rounded-tl-md rounded-br-md bg-gradient-to-r from-[#D4822A] to-[#B5691D] text-white font-sans text-[11px] sm:text-xs font-semibold tracking-wide shadow-2xs">
              {propertyTypeLabel}
            </span>
          </div>
        </div>

        {/* ── 2. PRICE AS TITLE & LOCATION ── */}
        <div className="pt-4 sm:pt-5 px-1">
          <h3
            lang="bn"
            className="font-nakkhatra font-normal text-2xl sm:text-[1.7rem] md:text-[1.85rem] leading-[1.32] text-[#181512] group-hover:text-[#9A6B3B] transition-colors duration-300 truncate pl-2 pr-1 py-1"
          >
            {priceTitle}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-[13px] text-[#6E6559] pl-1.5">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#181512] shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>
        </div>

        {/* ── 3. DIVIDER & SPECS ROW (BED, BATH, BALCONY) ── */}
        <div className="mt-3.5 sm:mt-4 pt-3.5 sm:pt-4 border-t border-[#181512]/[0.08] px-1 grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 text-[#3D362E]">
            <BedDouble className="w-4 h-4 text-[#181512] shrink-0" />
            <span className="font-stat text-xs sm:text-[13px] font-medium truncate">
              {bedsLabel}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-w-0 text-[#3D362E]">
            <Bath className="w-4 h-4 text-[#181512] shrink-0" />
            <span className="font-stat text-xs sm:text-[13px] font-medium truncate">
              {bathsLabel}
            </span>
          </div>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2 min-w-0 text-[#3D362E]">
            <Fence className="w-4 h-4 text-[#181512] shrink-0" />
            <span className="font-stat text-xs sm:text-[13px] font-medium truncate">
              {balconyLabel}
            </span>
          </div>
        </div>

        {/* ── 4. BOTTOM ROW: SQFT ON LEFT & VIEW DETAILS IN BOTTOM-RIGHT CUTOUT NOTCH ── */}
        <div className="mt-4 sm:mt-5 pt-1 pl-1 flex items-center justify-between gap-3">
          <div className="min-w-0 pb-1">
            <span className="font-stat text-base sm:text-lg md:text-xl font-bold text-[#181512] tracking-tight">
              {sqftLabel}
            </span>
          </div>

          {/* spacer for the bottom-right cutout notch */}
          <div className="w-[136px] sm:w-[152px] h-10 sm:h-11 shrink-0" aria-hidden="true" />
        </div>

        {/* Bottom-Right Cutout Notch with "View Details" CTA Button */}
        <div className="absolute bottom-0 right-0 z-10 bg-[#F4F1EC] pt-2.5 pl-3 rounded-tl-[22px] sm:rounded-tl-[26px]">
          {/* Left concave corner fillet along bottom edge */}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none absolute bottom-0 -left-4 sm:-left-5 w-4 h-4 sm:w-5 sm:h-5 fill-[#F4F1EC]"
          >
            <path d="M20 20H0C11.0457 20 20 11.0457 20 0V20Z" />
          </svg>

          {/* Top concave corner fillet along right edge */}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none absolute -top-4 sm:-top-5 right-0 w-4 h-4 sm:w-5 sm:h-5 fill-[#F4F1EC]"
          >
            <path d="M20 20H0C11.0457 20 20 11.0457 20 0V20Z" />
          </svg>

          <span className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#D4822A] to-[#B5691D] group-hover:from-[#B5691D] group-hover:to-[#9A6B3B] text-white font-sans text-xs sm:text-[13px] font-semibold tracking-wide shadow-[0_10px_24px_-8px_rgba(181,105,29,0.55)] transition-all duration-300 group-hover:scale-[1.02]">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
};
