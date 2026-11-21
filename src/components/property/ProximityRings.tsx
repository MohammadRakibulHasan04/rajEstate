import React, { useMemo, useState } from 'react';
import { GraduationCap, HeartPulse, MoonStar, ShoppingBag, Trees, Bus, MapPin, Footprints, Car } from 'lucide-react';
import { Listing, NearbyPlace, NearbyType, NEARBY_LABELS } from '../../types/listing';
import { isSafeHttpUrl } from '../../lib/media';

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
  school: '#2B6CB0',
  hospital: '#C53030',
  mosque: '#9A6B3B',
  market: '#7B4B94',
  park: '#2F7A52',
  transit: '#475569',
  other: '#5C5346',
};

const RINGS = [5, 10, 20];
const C = 200;
const radius = (m: number) => 34 + (Math.min(m, 25) / 25) * 150;

/**
 * Nearby places drawn on 5 / 10 / 20 minute rings, a sorted list and the
 * embedded map. Rendered inside the "Location & Nearby" page section.
 */
export const ProximityRings: React.FC<{ listing: Listing }> = ({ listing }) => {
  const [active, setActive] = useState<number | null>(null);
  const places = useMemo(() => listing.nearby.filter((p) => p.name.trim()), [listing.nearby]);
  const mapUrl = isSafeHttpUrl(listing.location.mapEmbedUrl) ? listing.location.mapEmbedUrl : undefined;

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

  return (
    <div className="space-y-10">
      {places.length > 0 && (
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <svg viewBox="0 0 400 400" className="w-full max-w-[420px] mx-auto" role="img" aria-label="Nearby places by travel time">
            {RINGS.map((m) => (
              <g key={m}>
                <circle cx={C} cy={C} r={radius(m)} fill="none" stroke="rgba(24,21,18,0.16)" strokeDasharray="2 6" />
                <text x={C + 4} y={C - radius(m) - 6} fill="#786F63" fontSize="9" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
                  {m} MIN
                </text>
              </g>
            ))}
            {plotted.map(({ p, x, y }, i) => (
              <g key={i} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} className="cursor-pointer">
                <line x1={C} y1={C} x2={x} y2={y} stroke={COLORS[p.type]} strokeOpacity={active === i ? 0.65 : 0.16} />
                <circle className="prox-dot" data-active={active === i} cx={x} cy={y} r={6} fill={COLORS[p.type]} fillOpacity="0.92" />
                {active === i && (
                  <text x={x} y={y - 14} textAnchor="middle" fill="#181512" fontSize="11" fontWeight="600">
                    {p.name}
                  </text>
                )}
              </g>
            ))}
            <circle cx={C} cy={C} r={14} fill="#ffffff" stroke="#9A6B3B" strokeWidth="1.5" />
            <circle cx={C} cy={C} r={4} fill="#9A6B3B" />
          </svg>

          <ul className="divide-y divide-[#181512]/[0.08] border-y border-[#181512]/[0.08]">
            {sorted.map(({ p, i }) => (
              <NearbyRow key={i} place={p} active={active === i} onHover={(v) => setActive(v ? i : null)} />
            ))}
          </ul>
        </div>
      )}

      {mapUrl && (
        <div className="rounded-2xl overflow-hidden border border-[#181512]/12 aspect-[16/8] bg-[#EAE3D7]">
          <iframe
            title={`Map of ${listing.location.area || listing.title}`}
            src={mapUrl}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      )}
    </div>
  );
};

const NearbyRow: React.FC<{ place: NearbyPlace; active: boolean; onHover: (v: boolean) => void }> = ({ place, active, onHover }) => {
  const Icon = ICONS[place.type] ?? MapPin;
  const Mode = place.mode === 'walk' ? Footprints : Car;
  return (
    <li
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`flex items-center gap-4 py-3.5 px-2 rounded-lg transition-colors ${active ? 'bg-[#9A6B3B]/[0.08]' : ''}`}
    >
      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${COLORS[place.type]}18`, color: COLORS[place.type] }}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[#181512] font-medium truncate">{place.name}</div>
        <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#786F63]">{NEARBY_LABELS[place.type]}</div>
      </div>
      <div className="flex items-center gap-1.5 text-[#4A433B]" aria-label={`${place.minutes} minutes by ${place.mode === 'walk' ? 'walking' : 'car'}`}>
        <Mode className="w-3.5 h-3.5 text-[#786F63]" />
        <span className="font-display text-lg text-[#181512]">{place.minutes}</span>
        <span className="text-[10px] font-mono uppercase text-[#786F63]">min</span>
      </div>
    </li>
  );
};
