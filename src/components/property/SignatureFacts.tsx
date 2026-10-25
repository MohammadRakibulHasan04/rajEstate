import React from 'react';
import { Fact } from '../../types/listing';

/** "Why this home": signature facts given full editorial weight. */
export const SignatureFacts: React.FC<{ facts: Fact[]; summary?: string }> = ({ facts, summary }) => {
  if (!facts.length && !summary) return null;
  return (
    <section id="why" className="relative overflow-hidden py-28 md:py-40">
      <span
        aria-hidden="true"
        className="text-outline pointer-events-none absolute -top-6 right-0 whitespace-nowrap font-display font-light italic text-[18vw] leading-none select-none"
      >
        Why
      </span>

      <div className="relative max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid lg:grid-cols-12 gap-10 items-end mb-16 md:mb-24" data-reveal>
          <div className="lg:col-span-7">
            <div className="eyebrow mb-7">Why this home</div>
            <h2 className="font-display font-light text-5xl sm:text-6xl lg:text-[5rem] leading-[0.95] tracking-[-0.02em]">
              যা একে <em className="italic text-gradient-gold">আলাদা করে।</em>
            </h2>
          </div>
          {summary && (
            <p className="lg:col-span-5 text-[15px] text-slate-400 font-light leading-relaxed">{summary}</p>
          )}
        </div>

        <ol className="border-t border-white/10">
          {facts.map((f, i) => (
            <li
              key={f.key}
              data-reveal
              className="group grid grid-cols-12 gap-6 md:gap-10 py-10 md:py-14 border-b border-white/10 hover:border-[#d1ad7a]/40 transition-colors duration-700"
            >
              <span
                aria-hidden="true"
                className="col-span-3 md:col-span-2 text-outline font-display font-light text-6xl md:text-8xl leading-none group-hover:[-webkit-text-stroke-color:rgba(209,173,122,0.6)] transition-all duration-700"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="col-span-9 md:col-span-4">
                <div className="mono-label">{f.label}{f.labelBn ? ` · ${f.labelBn}` : ''}</div>
                <div className="mt-3 font-display font-light text-3xl md:text-5xl leading-[1.02] text-[#f4efe6] group-hover:text-[#f1dfbd] transition-colors duration-700">
                  {f.value}
                </div>
              </div>
              <p className="col-span-12 md:col-span-6 md:pt-6 text-base md:text-lg text-slate-300/90 font-light leading-relaxed">
                {f.why}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
