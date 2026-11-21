/* ------------------------------------------------------------------
   SIGNIFICANCE ENGINE
   Turns raw specs into ranked facts that each explain *why* they
   matter, and scores how well a listing tells its story.
------------------------------------------------------------------- */
import { CATEGORY_LABELS, Fact, FactTier, Listing } from '../types/listing';
import { formatBdt, formatBdtRange, formatNumber, monthsUntil, formatMonth, ordinal, slugify, sqftToSqm, toBnDigits } from './format';

export interface EffectivePrice {
  amount: number;
  maxAmount?: number;
  isFrom: boolean;
}

/** Projects advertise "from" the cheapest available unit unless an explicit project price or range is set. */
export function effectivePrice(l: Listing): EffectivePrice {
  const rawMax = l.price.maxAmount && l.price.maxAmount > l.price.amount ? l.price.maxAmount : undefined;
  if (l.price.amount > 0) {
    return {
      amount: l.price.amount,
      ...(rawMax ? { maxAmount: rawMax } : {}),
      isFrom: !rawMax && l.kind === 'project' && l.units.length > 0,
    };
  }
  if (l.kind === 'project' && l.units.length) {
    const pool = l.units.filter((u) => u.status === 'available' && u.price > 0);
    const list = pool.length ? pool : l.units.filter((u) => u.price > 0);
    if (list.length) {
      const min = Math.min(...list.map((u) => u.price));
      const effMax = l.price.maxAmount && l.price.maxAmount > min ? l.price.maxAmount : undefined;
      return { amount: min, ...(effMax ? { maxAmount: effMax } : {}), isFrom: !effMax };
    }
  }
  return { amount: l.price.amount, ...(rawMax ? { maxAmount: rawMax } : {}), isFrom: false };
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
    return 'Catches the south breeze all year and soft winter sun, with less direct summer heat.';
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

  const amen = l.amenities
    .map((a) => (typeof a === 'string' ? a : a.label).toLowerCase())
    .join(' ');
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

/* ── Specifications for display ────────────────────────────────── */

/** Keys of facts computed from `core` specs. Anything else is an admin-written specification. */
export const CORE_FACT_KEYS: ReadonlySet<string> = new Set([
  'size',
  'facing',
  'floor',
  'rooms',
  'ppsf',
  'handover',
  'parking',
  'balconies',
  'land',
  'backup',
]);

export const isCoreFact = (f: Fact) => CORE_FACT_KEYS.has(f.key);

/** Admin-written specifications (e.g. "Flooring: Homogeneous tiles"). */
export function customFacts(l: Listing): Fact[] {
  return l.facts.filter((f) => !isCoreFact(f) && f.label?.trim() && f.value?.trim());
}

export interface SpecItem {
  key: string;
  label: string;
  value: string;
}

/**
 * Splits the structured specs into a short headline row (`primary`) and the
 * remaining property details. Every spec appears in exactly one of the two,
 * so the page never repeats a number.
 */
export function listingSpecs(l: Listing, unitCode?: string): { primary: SpecItem[]; details: SpecItem[] } {
  const c = l.core;
  const range = sizeRange(l);
  const sizeValue = range
    ? range.min === range.max
      ? `${formatNumber(range.min)} sq ft`
      : `${formatNumber(range.min)}–${formatNumber(range.max)} sq ft`
    : undefined;

  const primary: SpecItem[] = [];
  const details: SpecItem[] = [
    {
      key: 'type',
      label: 'Property Type',
      value: l.kind === 'project' ? `${CATEGORY_LABELS[l.category]} Project` : CATEGORY_LABELS[l.category],
    },
  ];
  if (unitCode) details.push({ key: 'unit', label: 'Unit', value: unitCode });

  if (l.kind === 'project') {
    if (l.units.length) primary.push({ key: 'units', label: 'Total Units', value: formatNumber(l.units.length) });
    if (sizeValue) primary.push({ key: 'size', label: 'Unit Sizes', value: sizeValue });
    const beds = Array.from(new Set(l.units.map((u) => u.beds).filter((b) => b > 0))).sort((a, b) => a - b);
    if (beds.length) {
      primary.push({ key: 'beds', label: 'Bedrooms', value: beds.length > 1 ? `${beds[0]}–${beds[beds.length - 1]}` : String(beds[0]) });
    }
    const balconies = Array.from(new Set(l.units.map((u) => u.balconies).filter((b) => typeof b === 'number' && b > 0))).sort((a, b) => a - b);
    if (balconies.length) {
      primary.push({ key: 'balconies', label: 'Balconies', value: balconies.length > 1 ? `${balconies[0]}–${balconies[balconies.length - 1]}` : String(balconies[0]) });
    }
    if (c.totalFloors) primary.push({ key: 'storeys', label: 'Storeys', value: String(c.totalFloors) });
    if (c.landKatha) details.push({ key: 'land', label: 'Land Area', value: `${c.landKatha} katha` });
  } else {
    if (c.beds) primary.push({ key: 'beds', label: 'Bedrooms', value: String(c.beds) });
    if (c.baths) primary.push({ key: 'baths', label: 'Bathrooms', value: String(c.baths) });
    if (c.balconies !== undefined && (c.balconies > 0 || Boolean(unitCode))) {
      primary.push({ key: 'balconies', label: 'Balconies', value: String(c.balconies) });
    }
    if (sizeValue) primary.push({ key: 'size', label: 'Area', value: sizeValue });
    if (c.landKatha) {
      (primary.length < 4 ? primary : details).push({ key: 'land', label: 'Land Area', value: `${c.landKatha} katha` });
    }
    if (c.floor) {
      details.push({ key: 'floor', label: 'Floor', value: c.totalFloors ? `${ordinal(c.floor)} of ${c.totalFloors}` : ordinal(c.floor) });
    } else if (c.totalFloors) {
      details.push({ key: 'storeys', label: 'Building Height', value: `${c.totalFloors} storeys` });
    }
  }

  if (c.facing) details.push({ key: 'facing', label: 'Facing', value: c.facing });
  if (c.balconies && !primary.some((p) => p.key === 'balconies')) details.push({ key: 'balconies', label: 'Balconies', value: String(c.balconies) });
  if (c.parking) details.push({ key: 'parking', label: 'Car Parking', value: String(c.parking) });
  if (l.construction !== 'ready' && c.handover) details.push({ key: 'handover', label: 'Expected Handover', value: formatMonth(c.handover) });

  return { primary, details };
}

/** Price per square foot, or null when it can't be computed honestly. */
export function pricePerSqft(l: Listing): number | null {
  const price = effectivePrice(l);
  const range = sizeRange(l);
  if (!price.amount || !range?.min) return null;
  return Math.round(price.amount / range.min);
}

export function priceLabel(l: Listing, bn = true): string {
  if (l.price.label?.trim()) {
    return bn ? toBnDigits(l.price.label.trim()) : l.price.label.trim();
  }
  const p = effectivePrice(l);
  if (p.amount > 0 && p.maxAmount && p.maxAmount > p.amount) {
    return formatBdtRange(p.amount, p.maxAmount, { bn });
  }
  const base = formatBdt(p.amount, { bn });
  if (!p.amount) return base;
  return p.isFrom ? (bn ? `${base} থেকে` : `From ${base}`) : base;
}

/** True when the listing is configured to display its price as the main headline/title. */
export function isPriceAsTitle(l: Listing): boolean {
  return l.titleMode === 'price';
}

/** True when the listing has a distinct custom property name (not empty and not just the formatted price label). */
export function hasCustomName(l: Listing): boolean {
  const t = l.title?.trim();
  if (!t) return false;
  if (l.price.label?.trim() && (t === l.price.label.trim() || t === toBnDigits(l.price.label.trim()))) return false;
  return (
    t !== priceLabel(l, false) &&
    t !== priceLabel(l, true) &&
    t !== formatBdtRange(l.price.amount, l.price.maxAmount, { bn: false }) &&
    t !== formatBdtRange(l.price.amount, l.price.maxAmount, { bn: true }) &&
    t !== formatBdt(l.price.amount, { bn: false }) &&
    t !== formatBdt(l.price.amount, { bn: true }) &&
    t !== 'Price on request' &&
    t !== 'মূল্য আলোচনা সাপেক্ষে'
  );
}

/**
 * Primary headline/title for a listing across cards, headers and meta tags.
 * Returns the Bangla formatted price when `titleMode === 'price'`, or the property name otherwise.
 */
export function displayTitle(l: Listing, bn = true): string {
  if (isPriceAsTitle(l)) {
    if (l.price.label?.trim()) return bn ? toBnDigits(l.price.label.trim()) : l.price.label.trim();
    const p = effectivePrice(l);
    if (p.amount > 0) return priceLabel(l, bn);
    return l.title?.trim() || priceLabel(l, bn);
  }
  return l.title?.trim() || priceLabel(l, bn);
}

/** Fallback string stored in `listing.title` when `titleMode === 'price'` and no custom property name was entered. */
export function fallbackListingName(l: Listing): string {
  if (l.price.label?.trim()) return toBnDigits(l.price.label.trim());
  const p = effectivePrice(l);
  if (p.amount > 0) return priceLabel(l, true);
  const parts = [CATEGORY_LABELS[l.category], l.location.area?.trim() || l.location.city?.trim()].filter(Boolean);
  return parts.join(' · ') || 'মূল্য আলোচনা সাপেক্ষে';
}

/** Generates a URL slug from either the property name or (when using price as title without a name) category, area and price. */
export function suggestSlug(l: Listing): string {
  if (l.title?.trim() && (!isPriceAsTitle(l) || hasCustomName(l))) {
    const s = slugify(l.title);
    if (s) return s;
  }
  const p = effectivePrice(l);
  const pricePart = p.amount > 0 ? formatBdt(p.amount, { bn: false }).replace(/৳\s*/, '') : '';
  const raw = [CATEGORY_LABELS[l.category], l.location.area?.trim() || l.location.city?.trim(), pricePart]
    .filter(Boolean)
    .join(' ');
  return slugify(raw);
}
