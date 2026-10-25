import React, { useState } from 'react';
import { Fact, Listing, Unit } from '../../types/listing';
import { UnitStack } from './UnitStack';

interface Props {
  listing: Listing;
  facts: Fact[];
  onInquireUnit: (u: Unit) => void;
  onOpenPlan: (url: string) => void;
}

/** Floor plans alongside the defining facts, each with its reason. */
export const PlanAndFacts: React.FC<Props> = ({ listing, facts, onInquireUnit, onOpenPlan }) => {
  const plans = listing.media.floorPlans;
  const [active, setActive] = useState(0);
  const plan = plans[active];
  if (!plans.length && !facts.length && !listing.units.length) return null;

  return (
    <section id="plan" className="relative overflow-hidden py-28 md:py-40">
      <span
        aria-hidden="true"
        className="text-outline pointer-events-none absolute top-8 left-0 whitespace-nowrap font-display font-light italic text-[20vw] leading-none select-none"
      >
        Blueprint
      </span>

      <div className="relative max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid lg:grid-cols-12 gap-10 items-end mb-16 md:mb-20" data-reveal>
          <div className="lg:col-span-7">
            <div className="eyebrow mb-7">The Plan</div>
            <h2 className="font-display font-light text-5xl sm:text-6xl lg:text-[5rem] leading-[0.95] tracking-[-0.02em]">
              সুচিন্তিত নকশা, <em className="italic text-gradient-gold">প্রতিটি ইঞ্চিতে।</em>
            </h2>
          </div>
          <p className="lg:col-span-4 lg:col-start-9 text-[15px] text-slate-400 font-light leading-relaxed">
            Every number below comes with its meaning: what it changes about the way you will live here.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          {plan && (
            <div className={facts.length ? 'lg:col-span-7' : 'lg:col-span-12'} data-reveal>
              <button
                id="floorplan-open"
                onClick={() => onOpenPlan(plan.url)}
                className="relative block w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0c1220] p-4 md:p-8 cursor-zoom-in group"
              >
                <img src={plan.url} alt={plan.caption || 'Floor plan'} className="w-full h-auto rounded-lg transition-transform duration-1000 group-hover:scale-[1.02]" loading="lazy" />
                <span className="absolute bottom-6 right-6 md:bottom-10 md:right-10 px-4 py-2 rounded-full panel-glass text-[10px] font-mono tracking-[0.28em] uppercase text-[#d1ad7a]">
                  {plan.caption || 'Floor plan'}
                </span>
              </button>
              {plans.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {plans.map((p, i) => (
                    <button key={p.url + i} className="chip" data-active={i === active} onClick={() => setActive(i)}>
                      {p.caption || `Plan ${i + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {facts.length > 0 && (
            <div className={plan ? 'lg:col-span-5' : 'lg:col-span-12 grid md:grid-cols-2 gap-x-12'}>
              {facts.map((f) => (
                <div key={f.key} data-reveal className="group py-6 border-b border-white/[0.08] hover:border-[#d1ad7a]/30 transition-colors duration-500">
                  <div className="flex items-baseline justify-between gap-6">
                    <div className="text-[10px] font-mono tracking-[0.24em] uppercase text-slate-500">
                      {f.label}
                      {f.labelBn && <span className="ml-2 normal-case tracking-normal font-sans text-slate-600">{f.labelBn}</span>}
                    </div>
                    <div className="font-display font-light text-2xl text-[#f4efe6] text-right group-hover:text-[#d1ad7a] transition-colors duration-500">
                      {f.value}
                    </div>
                  </div>
                  {f.why && <p className="mt-2.5 text-[13.5px] text-slate-400 leading-relaxed max-w-md">{f.why}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {listing.kind === 'project' && <UnitStack listing={listing} onInquireUnit={onInquireUnit} />}
      </div>
    </section>
  );
};
