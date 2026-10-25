/* ------------------------------------------------------------------
   SIGNIFICANCE ENGINE
   Turns raw specs into ranked facts that each explain *why* they
   matter, and scores how well a listing tells its story.
------------------------------------------------------------------- */
import { Fact, FactTier, Listing } from '../types/listing';
import { formatBdt, formatNumber, monthsUntil, formatMonth, ordinal, sqftToSqm } from './format';

export interface EffectivePrice {
  amount: number;
  isFrom: boolean;
}

/** Projects advertise "from" the cheapest available unit. */
export function effectivePrice(l: Listing): EffectivePrice {
  if (l.kind === 'project' && l.units.length) {
    const pool = l.units.filter((u) => u.status === 'available' && u.price > 0);
    const list = pool.length ? pool : l.units.filter((u) => u.price > 0);
    if (list.length) return { amount: Math.min(...list.map((u) => u.price)), isFrom: true };
  }
  return { amount: l.price.amount, isFrom: false };
}

export function sizeRange(l: Listing): { min: number; max: number } | null {
  if (l.kind === 'project' && l.units.length) {
    const s = l.units.map((u) => u.sizeSqft).filter(Boolean);
    if (s.length) return { min: Math.min(...s), max: Math.max(...s) };
  }
  if (l.core.sizeSqft) return { min: l.core.sizeSqft, max: l.core.sizeSqft };
  return null;
}

export function unitStats(l: Listing) {
  const total = l.units.length;
  const available = l.units.filter((u) => u.status === 'available').length;
  const booked = l.units.filter((u) => u.status === 'booked').length;
  const sold = l.units.filter((u) => u.status === 'sold').length;
  return { total, available, booked, sold };
}

/* ── Insight rules ─────────────────────────────────────────────── */

export function facingWhy(facing?: string): string | undefined {
  if (!facing) return undefined;
  const f = facing.toLowerCase();
  if (f.includes('south')) {
    if (f.includes('west'))
      return 'Gets the south breeze, but the afternoon sun hits the west side. Shaded balconies help keep it cool.';
    return 'Catches the দখিনা বাতাস (south breeze) all year and soft winter sun, with less direct summer heat.';
  }
  if (f.includes('west')) return 'Strong afternoon sun warms the rooms by evening. Heat-reflective curtains are worth budgeting for.';
  if (f.includes('east')) return 'Morning light fills the rooms early, and the interiors stay cool through the afternoon.';
  if (f.includes('north')) return 'Even, glare-free daylight all day, and the coolest orientation through Dhaka summers.';
  return undefined;
}

export function floorWhy(floor?: number, total?: number): string | undefined {
  if (!floor) return undefined;
  if (total && floor === total) return 'Top floor: no neighbours overhead and the widest views. Roof insulation matters in summer.';
  if (floor <= 2) return 'Close to the ground: easy to reach without the lift, though closer to street noise.';
  if (total && floor / total >= 0.55) return 'Above the street dust and noise line, with open views and steady cross-ventilation.';
  return 'Mid-level: a balance of quick access and quiet.';
}

function sizeWhy(sqft: number, beds?: number): string {
  if (!beds) return `${formatNumber(sqftToSqm(sqft))} m² of usable living space.`;
  const per = Math.round(sqft / beds);
  if (per >= 600) return `About ${formatNumber(per)} sq ft per bedroom, generous by Dhaka standards for a ${beds}-bed home.`;
  if (per >= 420) return `About ${formatNumber(per)} sq ft per bedroom: comfortable family proportions without wasted space.`;
  return `About ${formatNumber(per)} sq ft per bedroom: a compact, efficient plan that is easy to maintain.`;
}

function handoverWhy(l: Listing): string | undefined {
  if (l.construction === 'ready') return 'Ready now: no construction risk, so you can move in or rent it out immediately.';
  const m = monthsUntil(l.core.handover);
  if (m === null) return undefined;
  if (m <= 0) return 'Handover due now, with final finishing and documentation underway.';
  return `Keys in about ${m} month${m === 1 ? '' : 's'}. Instalments usually follow construction milestones.`;
}

/* ── Fact derivation ───────────────────────────────────────────── */

interface DerivedFact extends Fact {}

function make(key: string, label: string, labelBn: string, value: string, why: string | undefined, tier: FactTier): DerivedFact {
  return { key, label, labelBn, value, why, tier };
}

/** Facts that can be computed from structured specs. */
export function deriveCoreFacts(l: Listing): DerivedFact[] {
  const out: DerivedFact[] = [];
  const c = l.core;
  const range = sizeRange(l);
  const price = effectivePrice(l);

  if (range) {
    const value =
      range.min === range.max
        ? `${formatNumber(range.min)} sq ft`
        : `${formatNumber(range.min)}–${formatNumber(range.max)} sq ft`;
    const why =
      l.kind === 'project'
        ? `Unit sizes range from ${formatNumber(sqftToSqm(range.min))} to ${formatNumber(sqftToSqm(range.max))} m², with a plan for every stage of family life.`
        : sizeWhy(range.min, c.beds);
    out.push(make('size', 'Living Area', 'আয়তন', value, why, l.kind === 'project' ? 'defining' : 'signature'));
  }

  if (c.facing) out.push(make('facing', 'Orientation', 'মুখ', c.facing, facingWhy(c.facing), 'signature'));

  if (c.floor) {
    const v = c.totalFloors ? `${ordinal(c.floor)} of ${c.totalFloors} floors` : `${ordinal(c.floor)} floor`;
    out.push(make('floor', 'Floor Level', 'তলা', v, floorWhy(c.floor, c.totalFloors), 'defining'));
  } else if (c.totalFloors && l.kind === 'project') {
    out.push(
      make('floor', 'Building Height', 'তলা', `${c.totalFloors} storeys`, 'A boutique scale: fewer neighbours, quicker lifts, and a community you will actually know.', 'reference')
    );
  }

  if (c.beds) {
    const baths = c.baths || 0;
    const why =
      baths >= c.beds
        ? 'A bathroom for every bedroom, so no morning queues.'
        : `${baths} bathrooms shared across ${c.beds} bedrooms.`;
    out.push(make('rooms', 'Bedrooms & Baths', 'শয়নকক্ষ ও স্নানঘর', `${c.beds} bed · ${baths} bath`, why, 'defining'));
  }

  if (price.amount && range && range.min) {
    const pps = Math.round(price.amount / range.min);
    out.push(
      make(
        'ppsf',
        'Price per sq ft',
        'প্রতি বর্গফুট',
        `৳ ${formatNumber(pps)}`,
        `The honest comparison number. Use it to weigh this home against others in ${l.location.area || 'the area'}.`,
        'defining'
      )
    );
  }

  if (l.construction === 'ready' || c.handover) {
    const value = l.construction === 'ready' ? 'Ready to move' : formatMonth(c.handover);
    out.push(make('handover', 'Handover', 'হস্তান্তর', value, handoverWhy(l), l.construction === 'ready' ? 'defining' : 'signature'));
  }

  if (c.parking) {
    out.push(
      make(
        'parking',
        'Car Parking',
        'পার্কিং',
        `${c.parking} dedicated`,
        c.parking >= 2 ? 'Two reserved spaces are rare in this segment and add to resale value.' : 'A reserved space, valuable in a city where street parking is scarce.',
        'defining'
      )
    );
  }

  if (c.balconies) {
    out.push(
      make('balconies', 'Balconies', 'ব্যালকনি', String(c.balconies), `${c.balconies} private outdoor space${c.balconies > 1 ? 's' : ''} for plants, fresh air and the evening adda.`, 'reference')
    );
  }

  if (c.landKatha) {
    out.push(make('land', 'Land Area', 'জমি', `${c.landKatha} katha`, `About ${formatNumber(Math.round(c.landKatha * 720))} sq ft of land.`, 'defining'));
  }

  const amen = l.amenities.map((a) => a.toLowerCase()).join(' ');
  if (/generator|জেনারেটর/.test(amen)) {
    out.push(make('backup', 'Backup Power', 'ব্যাকআপ', 'Full generator', 'Lifts, lights and water keep running through load-shedding.', 'reference'));
  }

  return out;
}

/**
 * Merges derived facts into the listing's own facts:
 * - existing admin choices (tier, custom why) are preserved
 * - values are refreshed from the specs
 * - custom facts are kept untouched
 */
export function syncFacts(l: Listing): Fact[] {
  const derived = deriveCoreFacts(l);
  const existing = new Map(l.facts.map((f) => [f.key, f]));
  const merged: Fact[] = [];
  const derivedKeys = new Set(derived.map((d) => d.key));

  for (const d of derived) {
    const prev = existing.get(d.key);
    merged.push(prev ? { ...d, tier: prev.tier, why: prev.why?.trim() ? prev.why : d.why, label: prev.label || d.label } : d);
  }
  for (const f of l.facts) {
    if (!derivedKeys.has(f.key)) merged.push(f);
  }
  return merged;
}

/** The facts used for display. Falls back to derived facts if the admin never curated. */
export function resolveFacts(l: Listing): Fact[] {
  return l.facts.length ? syncFacts(l) : deriveCoreFacts(l);
}

export function factsByTier(l: Listing) {
  const all = resolveFacts(l);
  return {
    signature: all.filter((f) => f.tier === 'signature').slice(0, 3),
    defining: all.filter((f) => f.tier === 'defining'),
    reference: all.filter((f) => f.tier === 'reference'),
    all,
  };
}

export function suggestWhy(key: string, l: Listing): string | undefined {
  return deriveCoreFacts(l).find((f) => f.key === key)?.why;
}

/* ── Story score ───────────────────────────────────────────────── */

export interface ScoreTip {
  label: string;
  done: boolean;
  weight: number;
}

export function scoreListing(l: Listing): { score: number; tips: ScoreTip[] } {
  const { signature, defining } = factsByTier(l);
  const ranked = [...signature, ...defining];
  const price = effectivePrice(l);
  const tips: ScoreTip[] = [
    { label: 'Hero image set', done: !!l.media.hero.url, weight: 10 },
    { label: 'At least 5 gallery images', done: l.media.gallery.length >= 5, weight: 10 },
    { label: 'Floor plan added', done: l.media.floorPlans.length > 0 || l.units.some((u) => u.floorPlanUrl), weight: 8 },
    { label: 'Bangla title & tagline', done: !!l.titleBn.trim() && !!l.taglineBn.trim(), weight: 8 },
    { label: 'Summary of 120+ characters', done: l.summary.trim().length >= 120, weight: 6 },
    { label: '1–3 signature facts chosen', done: signature.length >= 1, weight: 12 },
    { label: '4+ defining facts', done: defining.length >= 4, weight: 10 },
    { label: 'Every ranked fact explains "why"', done: ranked.length > 0 && ranked.every((f) => !!f.why?.trim()), weight: 12 },
    { label: '3+ nearby places', done: l.nearby.length >= 3, weight: 8 },
    { label: 'Developer & approval details', done: !!l.trust.developer.trim() && !!l.trust.rajukApproval?.trim(), weight: 6 },
    { label: 'Contact phone', done: !!l.contact.phone.trim(), weight: 5 },
    { label: 'Price or units set', done: price.amount > 0, weight: 5 },
  ];
  const score = tips.reduce((s, t) => s + (t.done ? t.weight : 0), 0);
  return { score, tips };
}

export function priceLabel(l: Listing, bn = false): string {
  const p = effectivePrice(l);
  const base = formatBdt(p.amount, { bn });
  if (!p.amount) return base;
  return p.isFrom ? (bn ? `${base} থেকে` : `From ${base}`) : base;
}
