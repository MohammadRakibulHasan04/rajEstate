import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Fact, Listing, CATEGORY_LABELS, CONSTRUCTION_LABELS } from '../../types/listing';
import { formatNumber } from '../../lib/format';

/** The complete reference sheet: comprehensive, but visually quiet. */
export const SpecLedger: React.FC<{ listing: Listing; facts: Fact[] }> = ({ listing, facts }) => {
  const [open, setOpen] = useState(false);
  const c = listing.core;

  const rows: [string, string][] = [
    ['Type', listing.kind === 'project' ? `${CATEGORY_LABELS[listing.category]} project` : CATEGORY_LABELS[listing.category]],
    ['Status', CONSTRUCTION_LABELS[listing.construction]],
    ['Address', listing.location.address],
    ...facts.map((f) => [f.label, f.value] as [string, string]),
  ];
  if (c.totalFloors && !facts.some((f) => f.key === 'floor')) rows.push(['Building height', `${c.totalFloors} storeys`]);
  if (listing.kind === 'project') rows.push(['Total homes', formatNumber(listing.units.length)]);
  if (listing.price.negotiable) rows.push(['Price', 'Negotiable']);

  const shown = open ? rows : rows.slice(0, 8);

  return (
    <section id="specification" className="relative py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <div className="flex items-end justify-between gap-6 mb-10" data-reveal>
          <div>
            <div className="eyebrow mb-5">Full specification</div>
            <h2 className="font-display font-light text-4xl md:text-5xl leading-[1]">For the details-minded.</h2>
          </div>
          <span className="mono-label hidden sm:block">{rows.length} entries</span>
        </div>

        <dl className="grid md:grid-cols-2 gap-x-12">
          {shown.map(([k, v], i) => (
            <div key={k + i} className="flex items-baseline justify-between gap-6 py-4 border-b border-white/[0.07]">
              <dt className="text-[10.5px] font-mono tracking-[0.2em] uppercase text-slate-500 shrink-0">{k}</dt>
              <dd className="text-sm text-slate-200 text-right">{v || '—'}</dd>
            </div>
          ))}
        </dl>

        {rows.length > 8 && (
          <button id="spec-toggle" onClick={() => setOpen((v) => !v)} className="btn-quiet mt-8" aria-expanded={open}>
            {open ? 'Show less' : `Show all ${rows.length}`}
            <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${open ? 'rotate-180' : ''}`} />
          </button>
        )}

        {listing.amenities.length > 0 && (
          <div className="mt-14" data-reveal>
            <div className="mono-label mb-5">Amenities & features</div>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map((a) => (
                <span key={a} className="px-4 py-2 rounded-full text-sm border border-white/10 text-slate-300 bg-white/[0.02]">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
