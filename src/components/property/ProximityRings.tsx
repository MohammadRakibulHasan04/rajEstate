import React, { useMemo, useState } from 'react';
import { GraduationCap, HeartPulse, MoonStar, ShoppingBag, Trees, Bus, MapPin, Footprints, Car, Map as MapIcon } from 'lucide-react';
import { Listing, NearbyPlace, NearbyType, NEARBY_LABELS } from '../../types/listing';

const ICONS: Record<NearbyType, React.FC<{ className?: string }>> = {
  school: GraduationCap,
  hospital: HeartPulse,
  mosque: MoonStar,
  market: ShoppingBag,
  park: Trees,
  transit: Bus,
  other: MapPin,
};

const COLORS: Record<NearbyType, string> = {
  school: '#8fc3ff',
  hospital: '#f2a1a1',
  mosque: '#d1ad7a',
  market: '#e8c9f0',
  park: '#9fdcb4',
  transit: '#c9d1dc',
  other: '#f4efe6',
};

const RINGS = [5, 10, 20];
const C = 200;
const radius = (m: number) => 34 + (Math.min(m, 25) / 25) * 150;

/**
 * Proximity rings: distance shown as time on concentric 5/10/20 minute
 * rings, so "close" can be seen rather than calculated.
 */
export const ProximityRings: React.FC<{ listing: Listing }> = ({ listing }) => {
  const [active, setActive] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const places = listing.nearby;

  const plotted = useMemo(
    () =>
      places.map((p, i) => {
        const a = ((i * 137.508 - 90) * Math.PI) / 180;
        const r = radius(p.minutes);
        return { p, x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
      }),
    [places]
  );

  const sorted = useMemo(() => places.map((p, i) => ({ p, i })).sort((a, b) => a.p.minutes - b.p.minutes), [places]);
  const within10 = places.filter((p) => p.minutes <= 10).length;

  if (!places.length) return null;

  return (
    <section id="neighbourhood" className="relative py-28 md:py-40 border-t border-white/[0.06]">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid lg:grid-cols-12 gap-10 items-end mb-16" data-reveal>
          <div className="lg:col-span-7">
            <div className="eyebrow mb-7">The Neighbourhood</div>
            <h2 className="font-display font-light text-5xl sm:text-6xl lg:text-[5rem] leading-[0.95] tracking-[-0.02em]">
              প্রয়োজনের সবকিছু, <em className="italic text-gradient-gold">মিনিটের দূরত্বে।</em>
            </h2>
          </div>
          <p className="lg:col-span-4 lg:col-start-9 text-[15px] text-slate-400 font-light leading-relaxed">
            {within10} of the {places.length} places that matter most are within ten minutes of your door in {listing.location.area}.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6" data-reveal>
            <svg viewBox="0 0 400 400" className="w-full max-w-[560px] mx-auto" role="img" aria-label="Map of nearby places by travel time">
              <defs>
                <radialGradient id="prox-glow">
                  <stop offset="0%" stopColor="#d1ad7a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#d1ad7a" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx={C} cy={C} r={190} fill="url(#prox-glow)" opacity="0.25" />
              {RINGS.map((m) => (
                <g key={m}>
                  <circle cx={C} cy={C} r={radius(m)} fill="none" stroke="rgba(244,239,230,0.12)" strokeDasharray="2 6" />
                  <text x={C + 4} y={C - radius(m) - 6} fill="rgba(148,163,184,0.8)" fontSize="9" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
                    {m} MIN
                  </text>
                </g>
              ))}
              <line x1={C} y1={10} x2={C} y2={390} stroke="rgba(143,195,255,0.06)" />
              <line x1={10} y1={C} x2={390} y2={C} stroke="rgba(143,195,255,0.06)" />

              {plotted.map(({ p, x, y }, i) => (
                <g key={i} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} className="cursor-pointer">
                  <line x1={C} y1={C} x2={x} y2={y} stroke={COLORS[p.type]} strokeOpacity={active === i ? 0.6 : 0.08} />
                  <circle className="prox-dot" data-active={active === i} cx={x} cy={y} r={6} fill={COLORS[p.type]} fillOpacity="0.9" />
                  <circle cx={x} cy={y} r={12} fill={COLORS[p.type]} fillOpacity={active === i ? 0.18 : 0} />
                  {active === i && (
                    <text x={x} y={y - 16} textAnchor="middle" fill="#f4efe6" fontSize="11">
                      {p.name}
                    </text>
                  )}
                </g>
              ))}

              <circle cx={C} cy={C} r={14} fill="#070b14" stroke="#d1ad7a" strokeWidth="1.5" />
              <circle cx={C} cy={C} r={4} fill="#f1dfbd" />
            </svg>
          </div>

          <div className="lg:col-span-6">
            <ul className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {sorted.map(({ p, i }) => (
                <NearbyRow key={i} place={p} active={active === i} onHover={(v) => setActive(v ? i : null)} />
              ))}
            </ul>
            {listing.location.mapEmbedUrl && (
              <button id="show-map-btn" onClick={() => setShowMap((v) => !v)} className="btn-quiet mt-8">
                <MapIcon className="w-4 h-4" /> {showMap ? 'Hide map' : 'Open the map'}
              </button>
            )}
          </div>
        </div>

        {showMap && listing.location.mapEmbedUrl && (
          <div className="mt-12 rounded-2xl overflow-hidden border border-white/10 aspect-[16/7] bg-[#0c1220]">
            <iframe
              title={`Map of ${listing.location.area}`}
              src={listing.location.mapEmbedUrl}
              className="w-full h-full grayscale-[0.6] invert-[0.92] hue-rotate-180 contrast-[0.9]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </section>
  );
};

const NearbyRow: React.FC<{ place: NearbyPlace; active: boolean; onHover: (v: boolean) => void }> = ({ place, active, onHover }) => {
  const Icon = ICONS[place.type];
  const Mode = place.mode === 'walk' ? Footprints : Car;
  return (
    <li
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`flex items-center gap-5 py-5 transition-colors duration-300 ${active ? 'bg-white/[0.02]' : ''}`}
    >
      <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${COLORS[place.type]}1a`, color: COLORS[place.type] }}>
        <Icon className="w-4.5 h-4.5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] text-[#f4efe6] truncate">{place.name}</div>
        <div className="text-[10px] font-mono tracking-[0.22em] uppercase text-slate-500 mt-0.5">{NEARBY_LABELS[place.type]}</div>
      </div>
      <div className="flex items-center gap-2 text-right">
        <Mode className="w-3.5 h-3.5 text-slate-500" />
        <span className="font-display text-2xl text-[#f4efe6]">{place.minutes}</span>
        <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-500">min</span>
      </div>
    </li>
  );
};
