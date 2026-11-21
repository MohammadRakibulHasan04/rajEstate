import React from 'react';
import { Bath, BedDouble, Building2, Fence, LandPlot, Layers, MapPin, Ruler } from 'lucide-react';
import { CONSTRUCTION_LABELS, Listing, Unit, UnitStatus } from '../../types/listing';
import { displayTitle, hasCustomName, isPriceAsTitle, SpecItem } from '../../lib/significance';

export const UNIT_STATUS_LABEL: Record<UnitStatus, string> = { available: 'Available', booked: 'Booked', sold: 'Sold' };

export const unitStatusClass = (s: UnitStatus) =>
  s === 'available'
    ? 'border-emerald-700/35 bg-emerald-600/10 text-emerald-800'
    : s === 'booked'
      ? 'border-amber-700/35 bg-amber-500/12 text-amber-800'
      : 'border-[#181512]/15 bg-[#181512]/5 text-[#786F63]';

const SPEC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  beds: BedDouble,
  baths: Bath,
  balconies: Fence,
  size: Ruler,
  units: Building2,
  storeys: Layers,
  land: LandPlot,
};

interface Props {
  listing: Listing;
  parent?: Listing | null;
  unit?: Unit;
  specs: SpecItem[];
}

/** Title, address and the headline specs. Each spec is shown here and nowhere else. */
export const PropertyHeader: React.FC<Props> = ({ listing, unit, specs }) => {
  const address = [listing.location.address, listing.location.area, listing.location.city]
    .map((s) => s?.trim())
    .filter((s, i, arr) => s && !arr.slice(0, i).some((p) => p && p.toLowerCase().includes(s!.toLowerCase())));

  return (
    <header>
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <span className="px-3 py-1 rounded-full border border-[#9A6B3B]/40 bg-[#9A6B3B]/10 text-[10px] font-mono tracking-[0.2em] uppercase text-[#684724]">
          {CONSTRUCTION_LABELS[listing.construction]}
        </span>
        {unit && (
          <span className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-[0.2em] uppercase border ${unitStatusClass(unit.status)}`}>
            {UNIT_STATUS_LABEL[unit.status]}
          </span>
        )}
        {isPriceAsTitle(listing) && listing.price.negotiable && listing.kind !== 'project' && (
          <span className="px-3 py-1 rounded-full border border-[#9A6B3B]/40 bg-[#9A6B3B]/10 text-[10px] font-mono tracking-[0.2em] uppercase text-[#684724]">
            Negotiable Price
          </span>
        )}
      </div>

      <h1
        lang={isPriceAsTitle(listing) ? 'bn' : undefined}
        className={`${
          isPriceAsTitle(listing) ? 'font-nakkhatra font-normal' : 'font-display font-light'
        } text-4xl sm:text-5xl leading-[1.25] text-[#181512]`}
      >
        {displayTitle(listing)}
      </h1>
      {isPriceAsTitle(listing) && hasCustomName(listing) && (
        <p className="mt-2 font-display text-xl sm:text-2xl text-[#5C3D1E]">{listing.title}</p>
      )}

      {address.length > 0 && (
        <p className="mt-3 flex items-start gap-2 text-[15px] text-[#4A433B]">
          <MapPin className="w-4 h-4 mt-0.5 text-[#9A6B3B] shrink-0" />
          <span>{address.join(', ')}</span>
        </p>
      )}

      {specs.length > 0 && (
        <dl className="mt-7 grid grid-cols-2 sm:grid-cols-4 rounded-2xl border border-[#181512]/10 divide-x divide-y sm:divide-y-0 divide-[#181512]/10 overflow-hidden bg-white shadow-[0_2px_8px_-2px_rgba(24,21,18,0.04)]">
          {specs.map((s) => {
            const Icon = SPEC_ICONS[s.key];
            const match = s.value.match(/^(.+?)\s+(sq\s*ft|katha|storeys|units|ft²)$/i);
            return (
              <div key={s.key} className="px-5 py-4">
                <dt className="flex items-center gap-1.5 text-[10px] font-mono tracking-[0.22em] uppercase text-[#786F63]">
                  {Icon && <Icon className="w-3.5 h-3.5 text-[#9A6B3B] shrink-0" />}
                  <span className="truncate">{s.label}</span>
                </dt>
                <dd className="mt-1.5 font-stat text-xl sm:text-2xl font-semibold text-[#181512] tracking-tight flex items-baseline gap-1.5">
                  {match ? (
                    <>
                      <span>{match[1]}</span>
                      <span className="text-xs sm:text-sm font-normal text-[#786F63]">{match[2]}</span>
                    </>
                  ) : (
                    <span>{s.value}</span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </header>
  );
};
