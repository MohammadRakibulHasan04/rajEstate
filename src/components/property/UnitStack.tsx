import React, { useMemo, useState } from 'react';
import { ArrowRight, Compass, Layers, Ruler, BedDouble, Bath } from 'lucide-react';
import { Listing, Unit, UnitStatus } from '../../types/listing';
import { facingWhy, floorWhy, unitStats } from '../../lib/significance';
import { formatBdt, formatNumber, ordinal } from '../../lib/format';

interface Props {
  listing: Listing;
  onInquireUnit: (u: Unit) => void;
}

const STATUS_LABEL: Record<UnitStatus, string> = { available: 'Available', booked: 'Booked', sold: 'Sold' };

/**
 * A building drawn as floors × units. Availability, price and position
 * are all readable at a glance, and selecting a unit explains what its
 * floor and orientation mean for daily life.
 */
export const UnitStack: React.FC<Props> = ({ listing, onInquireUnit }) => {
  const units = listing.units;
  const stats = unitStats(listing);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [beds, setBeds] = useState<number | 'all'>('all');
  const firstAvailable = units.find((u) => u.status === 'available') ?? units[0];
  const [selectedId, setSelectedId] = useState<string | undefined>(firstAvailable?.id);
  const selected = units.find((u) => u.id === selectedId);

  const floors = useMemo(() => {
    const map = new Map<number, Unit[]>();
    units.forEach((u) => map.set(u.floor, [...(map.get(u.floor) ?? []), u]));
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([floor, list]) => ({ floor, list: list.sort((a, b) => a.code.localeCompare(b.code)) }));
  }, [units]);

  const bedOptions = useMemo(() => Array.from(new Set(units.map((u) => u.beds))).sort(), [units]);
  const totalFloors = listing.core.totalFloors || Math.max(...units.map((u) => u.floor));
  const matches = (u: Unit) => (!onlyAvailable || u.status === 'available') && (beds === 'all' || u.beds === beds);

  if (!units.length) return null;

  return (
    <div className="mt-20 md:mt-28" data-reveal>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="eyebrow mb-5">Choose your home</div>
          <h3 className="font-display font-light text-4xl md:text-5xl leading-[1]">
            {stats.available} of {stats.total} <em className="italic text-gradient-gold">still yours to choose.</em>
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button id="units-only-available" className="chip" data-active={onlyAvailable} onClick={() => setOnlyAvailable((v) => !v)}>
            Available only
          </button>
          {bedOptions.length > 1 &&
            (['all', ...bedOptions] as const).map((b) => (
              <button key={String(b)} className="chip" data-active={beds === b} onClick={() => setBeds(b as number | 'all')}>
                {b === 'all' ? 'All sizes' : `${b} bed`}
              </button>
            ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Building */}
        <div className="lg:col-span-7 panel p-5 md:p-8">
          <div className="flex items-center gap-5 mb-6 text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400">
            {(['available', 'booked', 'sold'] as const).map((s) => (
              <span key={s} className="flex items-center gap-2">
                <span className="unit-cell !min-w-0 !w-4 !h-4 !rounded" data-status={s} />
                {STATUS_LABEL[s]} · {stats[s]}
              </span>
            ))}
          </div>
          <div className="max-h-[560px] overflow-y-auto pr-2 space-y-2" role="grid" aria-label="Units by floor">
            {floors.map(({ floor, list }) => (
              <div key={floor} className="flex items-center gap-3" role="row">
                <span className="w-12 shrink-0 text-right text-[10px] font-mono tracking-[0.18em] text-slate-500">L{String(floor).padStart(2, '0')}</span>
                <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))` }}>
                  {list.map((u) => (
                    <button
                      key={u.id}
                      id={`unit-${u.code}`}
                      role="gridcell"
                      className="unit-cell"
                      data-status={u.status}
                      data-selected={u.id === selectedId}
                      data-dim={!matches(u)}
                      onClick={() => setSelectedId(u.id)}
                      aria-label={`Unit ${u.code}, ${STATUS_LABEL[u.status]}, ${u.sizeSqft} square feet`}
                    >
                      {u.code}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 ml-[60px] h-px bg-gradient-to-r from-[#d1ad7a]/60 to-transparent" />
          <div className="mt-2 ml-[60px] text-[10px] font-mono tracking-[0.24em] uppercase text-slate-500">Ground · Parking & lobby</div>
        </div>

        {/* Selected unit */}
        <aside className="lg:col-span-5">
          {selected ? (
            <div className="panel p-7 md:p-9 lg:sticky lg:top-28">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mono-label">Unit</div>
                  <div className="font-display font-light text-6xl leading-none mt-2 text-[#f4efe6]">{selected.code}</div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-[0.2em] uppercase border ${
                    selected.status === 'available'
                      ? 'border-[#d1ad7a]/60 text-[#f1dfbd] bg-[#d1ad7a]/10'
                      : 'border-white/10 text-slate-400'
                  }`}
                >
                  {STATUS_LABEL[selected.status]}
                </span>
              </div>

              <div className="mt-7 font-display text-3xl text-gradient-gold">{formatBdt(selected.price)}</div>
              {selected.price > 0 && selected.sizeSqft > 0 && (
                <div className="text-[11px] font-mono tracking-[0.18em] uppercase text-slate-500 mt-1">
                  ৳ {formatNumber(Math.round(selected.price / selected.sizeSqft))} / sq ft
                </div>
              )}

              <dl className="mt-7 grid grid-cols-3 gap-px rounded-xl overflow-hidden bg-white/10 border border-white/10">
                {[
                  { i: <Ruler className="w-4 h-4" />, l: 'Area', v: `${formatNumber(selected.sizeSqft)} ft²` },
                  { i: <BedDouble className="w-4 h-4" />, l: 'Beds', v: selected.beds },
                  { i: <Bath className="w-4 h-4" />, l: 'Baths', v: selected.baths },
                ].map((x) => (
                  <div key={x.l} className="bg-[#0a0f1b] p-4">
                    <dt className="flex items-center gap-1.5 mono-label !text-[#d1ad7a]">{x.i}{x.l}</dt>
                    <dd className="mt-2 font-display text-xl">{x.v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-7 space-y-5">
                <div className="flex gap-4">
                  <Layers className="w-5 h-5 text-[#d1ad7a] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-[#f4efe6]">{ordinal(selected.floor)} of {totalFloors} floors</div>
                    <p className="text-[13px] text-slate-400 leading-relaxed mt-1">{floorWhy(selected.floor, totalFloors)}</p>
                  </div>
                </div>
                {selected.facing && (
                  <div className="flex gap-4">
                    <Compass className="w-5 h-5 text-[#d1ad7a] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-[#f4efe6]">{selected.facing} facing</div>
                      <p className="text-[13px] text-slate-400 leading-relaxed mt-1">{facingWhy(selected.facing)}</p>
                    </div>
                  </div>
                )}
              </div>

              {selected.floorPlanUrl && (
                <a href={selected.floorPlanUrl} target="_blank" rel="noreferrer" className="mt-7 block rounded-xl overflow-hidden border border-white/10 bg-[#0c1220] p-3">
                  <img src={selected.floorPlanUrl} alt={`Floor plan of unit ${selected.code}`} className="w-full h-auto rounded-md" loading="lazy" />
                </a>
              )}

              <button
                id="unit-inquire-btn"
                onClick={() => onInquireUnit(selected)}
                disabled={selected.status === 'sold'}
                className="btn-gold w-full justify-center mt-8"
              >
                {selected.status === 'sold' ? 'This home is sold' : `Ask about ${selected.code}`} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
};
