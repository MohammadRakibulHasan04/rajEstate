import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Compass, Fence, Layers, Ruler, BedDouble, Bath } from 'lucide-react';
import { Listing, Unit, UnitStatus } from '../../types/listing';
import { facingWhy, floorWhy, unitStats } from '../../lib/significance';
import { formatBdt, formatNumber, ordinal } from '../../lib/format';
import { Link } from '../../lib/router';

interface Props {
  listing: Listing;
  onInquireUnit: (u: Unit) => void;
  /** unitId → apartment listing with its own detail page. */
  unitPages?: Record<string, Listing>;
  /** Pre-select a unit by code (e.g. arriving from an apartment page). */
  initialUnitCode?: string;
}

const STATUS_LABEL: Record<UnitStatus, string> = { available: 'Available', booked: 'Booked', sold: 'Sold' };

/**
 * A building drawn as floors × units. Availability, price and position
 * are all readable at a glance, and selecting a unit explains what its
 * floor and orientation mean for daily life.
 */
export const UnitStack: React.FC<Props> = ({ listing, onInquireUnit, unitPages = {}, initialUnitCode }) => {
  const units = listing.units;
  const stats = unitStats(listing);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [beds, setBeds] = useState<number | 'all'>('all');
  const initial =
    (initialUnitCode && units.find((u) => u.code.toLowerCase() === initialUnitCode.toLowerCase())) ||
    units.find((u) => u.status === 'available') ||
    units[0];
  const [selectedId, setSelectedId] = useState<string | undefined>(initial?.id);
  const selected = units.find((u) => u.id === selectedId);
  const selectedPage = selected ? unitPages[selected.id] : undefined;
  const pageCount = units.filter((u) => unitPages[u.id]).length;

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
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <p className="text-sm text-[#4A433B]">
          <span className="font-medium text-[#181512]">{stats.available}</span> of {stats.total} units available. Select a unit to see its details.
        </p>
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

      <div className="grid xl:grid-cols-12 gap-6">
        {/* Building */}
        <div className="xl:col-span-7 panel p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-5 mb-6 text-[10px] font-mono tracking-[0.2em] uppercase text-[#6E6559]">
            {(['available', 'booked', 'sold'] as const).map((s) => (
              <span key={s} className="flex items-center gap-2">
                <span className="unit-cell !min-w-0 !w-4 !h-4 !rounded" data-status={s} />
                {STATUS_LABEL[s]} · {stats[s]}
              </span>
            ))}
            {pageCount > 0 && (
              <span className="flex items-center gap-2">
                <span className="unit-page-dot !static inline-block" aria-hidden="true" />
                Detailed page · {pageCount}
              </span>
            )}
          </div>
          <div className="max-h-[560px] overflow-y-auto pr-2 space-y-2" role="grid" aria-label="Units by floor">
            {floors.map(({ floor, list }) => (
              <div key={floor} className="flex items-center gap-3" role="row">
                <span className="w-12 shrink-0 text-right text-[10px] font-mono tracking-[0.18em] text-[#786F63]">L{String(floor).padStart(2, '0')}</span>
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
                      aria-label={`Unit ${u.code}, ${STATUS_LABEL[u.status]}, ${u.sizeSqft} square feet${unitPages[u.id] ? ', has a detailed page' : ''}`}
                    >
                      {u.code}
                      {unitPages[u.id] && <span className="unit-page-dot" aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 ml-[60px] h-px bg-gradient-to-r from-[#9A6B3B]/50 to-transparent" />
          <div className="mt-2 ml-[60px] text-[10px] font-mono tracking-[0.24em] uppercase text-[#786F63]">Ground · Parking & lobby</div>
        </div>

        {/* Selected unit */}
        <aside className="xl:col-span-5">
          {selected ? (
            <div className="panel p-6 md:p-7 xl:sticky xl:top-28">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mono-label">Unit</div>
                  <div className="font-display font-light text-6xl leading-none mt-2 text-[#181512]">{selected.code}</div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-[0.2em] uppercase border ${
                    selected.status === 'available'
                      ? 'border-[#9A6B3B]/50 text-[#5C3D1E] bg-[#9A6B3B]/12 font-medium'
                      : 'border-[#181512]/12 text-[#786F63]'
                  }`}
                >
                  {STATUS_LABEL[selected.status]}
                </span>
              </div>

              <div lang="bn" className="mt-7 font-nakkhatra font-normal text-3xl text-gradient-gold">{formatBdt(selected.price)}</div>
              {selected.price > 0 && selected.sizeSqft > 0 && (
                <div className="text-[11px] font-mono tracking-[0.18em] uppercase text-[#786F63] mt-1">
                  ৳ {formatNumber(Math.round(selected.price / selected.sizeSqft))} / sq ft
                </div>
              )}

              <dl className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden bg-[#181512]/10 border border-[#181512]/10">
                {[
                  { i: <BedDouble className="w-4 h-4" />, l: 'Beds', v: selected.beds },
                  { i: <Bath className="w-4 h-4" />, l: 'Baths', v: selected.baths },
                  { i: <Fence className="w-4 h-4" />, l: 'Balcony', v: selected.balconies ?? 0 },
                  { i: <Ruler className="w-4 h-4" />, l: 'Area', v: `${formatNumber(selected.sizeSqft)} ft²` },
                ].map((x) => (
                  <div key={x.l} className="bg-[#ffffff] p-4">
                    <dt className="flex items-center gap-1.5 mono-label !text-[#9A6B3B]">{x.i}{x.l}</dt>
                    <dd className="mt-2 font-stat font-semibold text-xl text-[#181512]">{x.v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-7 space-y-5">
                <div className="flex gap-4">
                  <Layers className="w-5 h-5 text-[#9A6B3B] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-[#181512] font-medium">{ordinal(selected.floor)} of {totalFloors} floors</div>
                    <p className="text-[13px] text-[#4A433B] leading-relaxed mt-1">{floorWhy(selected.floor, totalFloors)}</p>
                  </div>
                </div>
                {selected.facing && (
                  <div className="flex gap-4">
                    <Compass className="w-5 h-5 text-[#9A6B3B] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-[#181512] font-medium">{selected.facing} facing</div>
                      <p className="text-[13px] text-[#4A433B] leading-relaxed mt-1">{facingWhy(selected.facing)}</p>
                    </div>
                  </div>
                )}
              </div>

              {selected.floorPlanUrl && (
                <a href={selected.floorPlanUrl} target="_blank" rel="noreferrer" className="mt-7 block rounded-xl overflow-hidden border border-[#181512]/10 bg-[#ffffff] p-3">
                  <img src={selected.floorPlanUrl} alt={`Floor plan of unit ${selected.code}`} className="w-full h-auto rounded-md" loading="lazy" />
                </a>
              )}

              {selectedPage && (
                <Link
                  to={`/property/${selectedPage.slug}`}
                  id="unit-page-link"
                  className="btn-gold w-full justify-center mt-8"
                >
                  View Unit {selected.code} <ArrowUpRight className="w-4 h-4" />
                </Link>
              )}

              <button
                id="unit-inquire-btn"
                onClick={() => onInquireUnit(selected)}
                disabled={selected.status === 'sold'}
                className={`${selectedPage ? 'btn-quiet mt-3' : 'btn-gold mt-8'} w-full justify-center`}
              >
                {selected.status === 'sold' ? 'Unit Sold' : `Enquire About ${selected.code}`} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
};
