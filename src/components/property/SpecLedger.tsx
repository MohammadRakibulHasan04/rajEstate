import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Fact, Listing, CATEGORY_LABELS, CONSTRUCTION_LABELS } from '../../types/listing';
import { getAmenityIconMeta, normalizeAmenities } from '../../lib/amenities';
import { formatNumber } from '../../lib/format';

/** The complete reference sheet: comprehensive specifications and elevated amenity cards. */
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
  const amenities = normalizeAmenities(listing.amenities);

  return (
    <section id="specification" className="relative py-24 md:py-36">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex items-end justify-between gap-6 mb-10" data-reveal>
          <div>
            <div className="eyebrow mb-5">Full specification</div>
            <h2 className="font-display font-light text-4xl md:text-5xl leading-[1]">For the details-minded.</h2>
          </div>
          <span className="mono-label hidden sm:block">{rows.length} entries</span>
        </div>

        <dl className="grid md:grid-cols-2 gap-x-12" data-reveal>
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

        {amenities.length > 0 && (
          <div className="mt-24 pt-16 border-t border-white/[0.08]" data-reveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="eyebrow mb-4">Amenities &amp; Features · সুযোগ-সুবিধা</div>
                <h3 className="font-display font-light text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.02] text-[#f4efe6]">
                  প্রতিদিনের স্বাচ্ছন্দ্য ও <em className="italic text-gradient-gold">নিরাপত্তা।</em>
                </h3>
              </div>
              <span className="mono-label text-[#d1ad7a]">
                {String(amenities.length).padStart(2, '0')} Curated Features
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {amenities.map((item, idx) => {
                const meta = getAmenityIconMeta(item.icon, item.label);
                const Icon = meta.Icon;
                const no = String(idx + 1).padStart(2, '0');
                return (
                  <div
                    key={`${item.label}-${idx}`}
                    className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-5 md:p-6 hover:border-[#d1ad7a]/55 hover:from-[#d1ad7a]/[0.09] hover:to-white/[0.02] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between min-h-[156px]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-12 h-12 rounded-xl border border-[#d1ad7a]/35 bg-[#d1ad7a]/10 flex items-center justify-center text-[#d1ad7a] group-hover:scale-105 group-hover:bg-[#d1ad7a]/20 group-hover:border-[#d1ad7a]/70 transition-all duration-500 shadow-[0_10px_28px_-10px_rgba(209,173,122,0.4)]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[10px] tracking-[0.26em] text-slate-500 group-hover:text-[#d1ad7a]/80 transition-colors">
                        {no}
                      </span>
                    </div>

                    <div className="mt-6">
                      <div className="font-display font-light text-xl md:text-2xl text-[#f4efe6] group-hover:text-[#f1dfbd] leading-snug transition-colors">
                        {item.label}
                      </div>
                      <div className="mt-1.5 text-[10.5px] font-mono tracking-[0.2em] uppercase text-[#d1ad7a]/75">
                        {item.detail || meta.category}
                      </div>
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
