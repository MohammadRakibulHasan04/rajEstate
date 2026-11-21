import React from 'react';
import { ArrowUpRight, Building2, MapPin } from 'lucide-react';
import { CONSTRUCTION_LABELS, Listing, Unit, UnitStatus } from '../../types/listing';
import { SpecItem } from '../../lib/significance';
import { Link } from '../../lib/router';
import { projectHref } from './ProjectLink';

export const UNIT_STATUS_LABEL: Record<UnitStatus, string> = { available: 'Available', booked: 'Booked', sold: 'Sold' };

export const unitStatusClass = (s: UnitStatus) =>
  s === 'available'
    ? 'border-emerald-700/35 bg-emerald-600/10 text-emerald-800'
    : s === 'booked'
      ? 'border-amber-700/35 bg-amber-500/12 text-amber-800'
      : 'border-[#181512]/15 bg-[#181512]/5 text-[#786F63]';

interface Props {
  listing: Listing;
  parent?: Listing | null;
  unit?: Unit;
  specs: SpecItem[];
}

/** Title, address and the headline specs. Each spec is shown here and nowhere else. */
export const PropertyHeader: React.FC<Props> = ({ listing, parent, unit, specs }) => {
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
        {parent && (
          <Link
            to={projectHref(parent, unit?.code)}
            id="header-project-link"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#181512]/12 text-[10px] font-mono tracking-[0.2em] uppercase text-[#5C3D1E] hover:border-[#9A6B3B] transition-colors"
          >
            <Building2 className="w-3 h-3 text-[#9A6B3B]" /> Part of {parent.title}
            <ArrowUpRight className="w-3 h-3 text-[#9A6B3B]" />
          </Link>
        )}
      </div>

      <h1 className="font-display font-light text-4xl sm:text-5xl leading-[1.2] text-[#181512]">{listing.title}</h1>

      {address.length > 0 && (
        <p className="mt-3 flex items-start gap-2 text-[15px] text-[#4A433B]">
          <MapPin className="w-4 h-4 mt-0.5 text-[#9A6B3B] shrink-0" />
          <span>{address.join(', ')}</span>
        </p>
      )}

      {specs.length > 0 && (
        <dl className="mt-7 grid grid-cols-2 sm:grid-cols-4 rounded-2xl border border-[#181512]/10 divide-x divide-y sm:divide-y-0 divide-[#181512]/10 overflow-hidden bg-white">
          {specs.map((s) => (
            <div key={s.key} className="px-5 py-4">
              <dt className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#786F63]">{s.label}</dt>
              <dd className="mt-1 font-display text-xl text-[#181512]">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
};
