import React from 'react';
import { StoryChapter } from '../../types/listing';

/** Data-driven version of the original ProjectOnePage chapters. */
export const StoryChapters: React.FC<{ chapters: StoryChapter[] }> = ({ chapters }) => {
  if (!chapters.length) return null;
  return (
    <div id="story">
      {chapters.map((ch, i) => {
        const no = String(i + 1).padStart(2, '0');
        if (ch.layout === 'full') {
          return (
            <section key={i} data-chapter className="relative overflow-hidden">
              <div data-ch-fig className="relative w-full h-[80vh] md:h-[92vh] overflow-hidden">
                <img
                  data-ch-img
                  src={ch.imageUrl}
                  alt={ch.titleEn}
                  loading="lazy"
                  className="absolute inset-0 w-full h-[125%] object-cover will-change-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/30 to-transparent" />
                <div className="grain" aria-hidden="true" />
              </div>
              <div data-ch-text className="absolute bottom-0 inset-x-0 px-6 md:px-12 lg:px-20 pb-16 md:pb-24 z-10 max-w-[90rem] mx-auto">
                <div className="max-w-3xl">
                  <div className="eyebrow mb-5">Chapter {no} · {ch.kicker}</div>
                  <h2 className="font-display font-light text-4xl sm:text-5xl lg:text-7xl leading-[0.96] tracking-[-0.02em]">{ch.titleBn}</h2>
                  <p className="mt-6 text-[15px] text-slate-300/90 font-light leading-relaxed max-w-lg">{ch.body}</p>
                </div>
              </div>
            </section>
          );
        }
        const reversed = ch.layout === 'left';
        return (
          <section key={i} data-chapter className="relative overflow-hidden py-24 md:py-36">
            <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
              <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                <div className={`lg:col-span-7 ${reversed ? 'lg:order-2' : ''}`}>
                  <div className="relative">
                    <figure data-ch-fig className="parallax-figure aspect-[4/3] rounded-lg">
                      <img data-ch-img src={ch.imageUrl} alt={ch.titleEn} loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/50 via-transparent to-transparent" />
                    </figure>
                    <span
                      data-ch-num
                      aria-hidden="true"
                      className={`text-outline font-display font-light absolute -bottom-10 ${reversed ? '-left-6 lg:-left-14' : '-right-6 lg:-right-14'} text-[20vw] lg:text-[13vw] leading-none select-none pointer-events-none hidden md:block`}
                    >
                      {no}
                    </span>
                  </div>
                </div>
                <div className={`lg:col-span-5 ${reversed ? 'lg:order-1' : ''}`} data-ch-text>
                  <div className="eyebrow mb-6">Chapter {no} · {ch.kicker}</div>
                  <h2 className="font-display font-light text-4xl sm:text-5xl lg:text-[3.5rem] leading-[0.98] tracking-[-0.02em]">{ch.titleBn}</h2>
                  <div data-ch-line className="mt-6 h-px bg-gradient-to-r from-[#d1ad7a] to-transparent origin-left" />
                  <p className="mt-6 text-[15px] text-slate-300/90 font-light leading-relaxed">{ch.body}</p>
                  <p className="mt-3 text-xs font-mono tracking-[0.2em] uppercase text-[#d1ad7a]/70">{ch.titleEn}</p>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};
