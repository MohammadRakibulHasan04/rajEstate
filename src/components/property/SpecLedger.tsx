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
            <h2 className="font-display font-light text-4xl md:text-5xl leading-[1] text-[#181512]">For the details-minded.</h2>
          </div>
          <span className="mono-label hidden sm:block">{rows.length} entries</span>
        </div>

        <dl className="grid md:grid-cols-2 gap-x-12" data-reveal>
          {shown.map(([k, v], i) => (
            <div key={k + i} className="flex items-baseline justify-between gap-6 py-4 border-b border-[#181512]/[0.08]">
              <dt className="text-[10.5px] font-mono tracking-[0.2em] uppercase text-[#6E6559] shrink-0">{k}</dt>
              <dd className="text-sm text-[#181512] font-medium text-right">{v || '—'}</dd>
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
          <div className="mt-24 pt-16 border-t border-[#181512]/10" data-reveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div className="max-w-3xl w-full">
                <div className="eyebrow mb-4">Amenities &amp; Features · সুযোগ-সুবিধা</div>
                <h3 className="font-display font-light text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.3] sm:leading-[1.34] tracking-normal text-[#181512] py-1">
                  প্রতিদিনের স্বাচ্ছন্দ্য ও <em className="italic text-gradient-gold">নিরাপত্তা।</em>
                </h3>
              </div>
              <span className="mono-label text-[#9A6B3B]">
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
                    className="group relative rounded-2xl border border-[#181512]/[0.09] bg-gradient-to-b from-[#FFFFFF] to-[#FAF7F2] p-5 md:p-6 shadow-[0_10px_28px_-14px_rgba(24,21,18,0.06)] hover:border-[#9A6B3B]/55 hover:from-[#FFFFFF] hover:to-[#F7EFE2] hover:shadow-[0_18px_40px_-14px_rgba(154,107,59,0.18)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between min-h-[156px]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-12 h-12 rounded-xl border border-[#9A6B3B]/30 bg-[#9A6B3B]/10 flex items-center justify-center text-[#855B30] group-hover:scale-105 group-hover:bg-[#9A6B3B] group-hover:text-[#FAF7F2] group-hover:border-[#9A6B3B] transition-all duration-500 shadow-[0_8px_22px_-8px_rgba(154,107,59,0.28)]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[10px] tracking-[0.26em] text-[#8C8275] group-hover:text-[#9A6B3B] transition-colors">
                        {no}
                      </span>
                    </div>

                    <div className="mt-6">
                      <div className="font-display font-light text-xl md:text-2xl text-[#181512] group-hover:text-[#684724] leading-[1.35] tracking-normal transition-colors py-0.5">
                        {item.label}
                      </div>
                      <div className="mt-1.5 text-[10.5px] font-mono tracking-[0.2em] uppercase text-[#855B30]">
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
