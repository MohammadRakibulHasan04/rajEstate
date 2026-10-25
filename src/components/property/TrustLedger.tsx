import React from 'react';
import { ShieldCheck, Building2, FileCheck2, Check } from 'lucide-react';
import { Listing } from '../../types/listing';
import { formatMonth, monthsUntil } from '../../lib/format';

/** Trust signals, each explained, plus the construction timeline. */
export const TrustLedger: React.FC<{ listing: Listing }> = ({ listing }) => {
  const { trust } = listing;
  const milestones = trust.milestones;
  const doneCount = milestones.filter((m) => m.done).length;
  const progress = milestones.length ? (doneCount / milestones.length) * 100 : 0;
  const months = monthsUntil(listing.core.handover);

  const items = [
    {
      icon: Building2,
      label: 'Developer',
      value: trust.developer,
      why: 'The developer is responsible for build quality and for every promise in this listing.',
    },
    {
      icon: ShieldCheck,
      label: 'RAJUK approval',
      value: trust.rajukApproval,
      why: 'A sanctioned plan is needed for bank loans, utility connections and clean registration.',
    },
    {
      icon: FileCheck2,
      label: 'Land title',
      value: trust.landTitle,
      why: 'Clear ownership and mutation records protect your title for generations.',
    },
  ];

  if (!trust.developer && !milestones.length) return null;

  return (
    <section id="trust" className="relative py-28 md:py-36 bg-[#05080f] border-y border-white/[0.06]">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid lg:grid-cols-12 gap-10 mb-16" data-reveal>
          <div className="lg:col-span-6">
            <div className="eyebrow mb-7">Peace of mind</div>
            <h2 className="font-display font-light text-5xl sm:text-6xl leading-[0.95] tracking-[-0.02em]">
              বিশ্বাসের <em className="italic text-gradient-gold">ভিত্তি।</em>
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {items.map(({ icon: Icon, label, value, why }) => (
            <div key={label} className="panel p-7" data-reveal>
              <Icon className="w-6 h-6 text-[#d1ad7a]" />
              <div className="mono-label mt-6">{label}</div>
              <div className={`mt-2 font-display text-2xl ${value ? 'text-[#f4efe6]' : 'text-slate-500 italic'}`}>
                {value || 'Shared on request'}
              </div>
              <p className="mt-3 text-[13px] text-slate-400 leading-relaxed">{why}</p>
            </div>
          ))}
        </div>

        {milestones.length > 0 && (
          <div className="mt-20" data-reveal>
            <div className="flex items-end justify-between gap-6 mb-10">
              <div className="mono-label">Construction journey</div>
              <div className="font-display text-xl text-[#f4efe6]">
                {listing.construction === 'ready'
                  ? 'Complete'
                  : months !== null && months > 0
                    ? <>Keys in <span className="text-gradient-gold">{months} months</span></>
                    : `${doneCount} of ${milestones.length} stages done`}
              </div>
            </div>
            <div className="relative">
              <div className="absolute left-0 right-0 top-[11px] h-px bg-white/10" />
              <div className="absolute left-0 top-[11px] h-px bg-gradient-to-r from-[#d1ad7a] to-[#f1dfbd]" style={{ width: `${progress}%` }} />
              <ol className="relative grid gap-6" style={{ gridTemplateColumns: `repeat(${milestones.length}, minmax(0, 1fr))` }}>
                {milestones.map((m, i) => (
                  <li key={i} className="flex flex-col">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                        m.done ? 'bg-[#d1ad7a] border-[#d1ad7a] text-[#120d07]' : 'bg-[#05080f] border-white/20'
                      }`}
                    >
                      {m.done && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className={`mt-4 text-sm ${m.done ? 'text-[#f4efe6]' : 'text-slate-400'}`}>{m.label}</span>
                    <span className="mt-1 text-[10px] font-mono tracking-[0.18em] uppercase text-slate-500">{formatMonth(m.date)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
