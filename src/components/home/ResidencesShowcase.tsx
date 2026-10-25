import React, { useState, useMemo } from 'react';
import { ArrowUpRight, Compass, Filter, Sparkles } from 'lucide-react';
import { usePublishedListings } from '../../lib/listings';
import { ListingCard } from '../property/ListingCard';
import { CATEGORY_LABELS } from '../../types/listing';

export const ResidencesShowcase: React.FC = () => {
  const { listings, loading } = usePublishedListings();
  const [filter, setFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => set.add(l.category));
    return Array.from(set);
  }, [listings]);

  const filtered = useMemo(() => {
    if (filter === 'all') return listings;
    if (filter === 'projects') return listings.filter((l) => l.kind === 'project');
    return listings.filter((l) => l.category === filter);
  }, [listings, filter]);

  return (
    <section
      id="showcase"
      className="relative overflow-hidden bg-[#070b14] text-[#f4efe6] py-28 md:py-40 border-t border-white/[0.08]"
    >
      <div className="hairline max-w-7xl mx-auto mb-20" />

      {/* Decorative background watermark */}
      <span
        aria-hidden="true"
        className="text-outline pointer-events-none absolute top-12 left-0 whitespace-nowrap font-display font-light italic text-[18vw] leading-none select-none opacity-40"
      >
        Residences
      </span>

      <div className="relative max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20 space-y-16">
        {/* Editorial Heading Strip */}
        <div className="grid lg:grid-cols-12 gap-10 items-end" data-reveal>
          <div className="lg:col-span-7">
            <div className="eyebrow mb-6">Curated Portfolio</div>
            <h2 className="font-display font-light text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.02em]">
              নির্বাচিত কিছু{' '}
              <em className="italic text-gradient-gold">স্থপতি নিদর্শন।</em>
            </h2>
          </div>
          <p className="lg:col-span-4 lg:col-start-9 text-[15px] text-slate-400 font-light leading-relaxed">
            Every residence here is individually designed and meticulously vetted. No naked numbers — each home carries a complete narrative archive from blueprint to reality.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6" data-reveal>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`chip cursor-pointer ${
                filter === 'all'
                  ? '!border-[#d1ad7a] !bg-[#d1ad7a]/15 !text-[#f1dfbd]'
                  : ''
              }`}
            >
              All Residences ({listings.length})
            </button>

            {listings.some((l) => l.kind === 'project') && (
              <button
                onClick={() => setFilter('projects')}
                className={`chip cursor-pointer ${
                  filter === 'projects'
                    ? '!border-[#d1ad7a] !bg-[#d1ad7a]/15 !text-[#f1dfbd]'
                    : ''
                }`}
              >
                Multi-Unit Projects
              </button>
            )}

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`chip cursor-pointer ${
                  filter === cat
                    ? '!border-[#d1ad7a] !bg-[#d1ad7a]/15 !text-[#f1dfbd]'
                    : ''
                }`}
              >
                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}
              </button>
            ))}
          </div>

          <span className="mono-label hidden md:inline text-slate-500">
            Showing {filtered.length} of {listings.length} residences
          </span>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="panel p-16 text-center space-y-4">
            <Compass className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="font-display text-2xl text-slate-300">No residences found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              No properties matched the selected typology filter.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {filtered.map((listing, index) => (
              <div key={listing.id || listing.slug} data-reveal>
                <ListingCard
                  listing={listing}
                  index={index}
                  size={index === 0 && filtered.length > 2 ? 'large' : 'normal'}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
