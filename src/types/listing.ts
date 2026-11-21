/* ------------------------------------------------------------------
   LISTING MODEL
   A listing is either a single property (one flat / house / plot) or a
   project (a building containing many units).

   Language convention: names, labels and headings are English; free-text
   descriptions (summary, custom section bodies) are written in Bangla.
------------------------------------------------------------------- */

export type ListingKind = 'single' | 'project';
export type PublishState = 'draft' | 'published' | 'archived';
export type ConstructionState = 'upcoming' | 'ongoing' | 'ready';
export type ListingCategory = 'apartment' | 'duplex' | 'penthouse' | 'house' | 'commercial' | 'land';
export type TitleMode = 'name' | 'price';

export type FactTier = 'signature' | 'defining' | 'reference';

export interface Fact {
  /** Stable key. Known keys (facing, floor, size…) get auto insights. */
  key: string;
  label: string;
  labelBn?: string;
  value: string;
  /** One sentence describing what this fact means for daily life. */
  why?: string;
  tier: FactTier;
}

export type UnitStatus = 'available' | 'booked' | 'sold';

export interface Unit {
  id: string;
  code: string; // e.g. "7A"
  floor: number;
  sizeSqft: number;
  beds: number;
  baths: number;
  balconies: number;
  facing: string;
  price: number;
  status: UnitStatus;
  floorPlanUrl?: string;
}

export interface MediaImage {
  url: string;
  caption?: string;
  captionBn?: string;
  room?: string;
}

/** @deprecated Editorial chapters are no longer edited or displayed. Kept only so legacy documents still type-check. */
export interface StoryChapter {
  kicker: string;
  titleBn: string;
  titleEn: string;
  body: string;
  imageUrl: string;
  layout: 'left' | 'right' | 'full';
}

export type NearbyType = 'school' | 'hospital' | 'mosque' | 'market' | 'park' | 'transit' | 'other';

export type AmenityIconKey =
  | 'elevator'
  | 'security'
  | 'generator'
  | 'gas'
  | 'intercom'
  | 'cctv'
  | 'fire-safety'
  | 'rooftop-garden'
  | 'parking'
  | 'gym'
  | 'pool'
  | 'community-hall'
  | 'prayer-room'
  | 'playground'
  | 'wifi'
  | 'solar'
  | 'water-filter'
  | 'ev-charging'
  | 'concierge'
  | 'balcony'
  | 'air-conditioning'
  | 'sparkles';

export interface AmenityItem {
  label: string;
  icon?: AmenityIconKey;
  detail?: string;
}

export interface NearbyPlace {
  name: string;
  type: NearbyType;
  minutes: number;
  mode: 'walk' | 'drive';
}

export interface Milestone {
  label: string;
  date: string; // YYYY-MM
  done: boolean;
}

export interface CoreSpecs {
  sizeSqft?: number;
  beds?: number;
  baths?: number;
  balconies?: number;
  parking?: number;
  floor?: number;
  totalFloors?: number;
  facing?: string;
  landKatha?: number;
  /** YYYY-MM */
  handover?: string;
}

/**
 * Links a single listing (e.g. one apartment) to the project it belongs to.
 * Only the id is stored; slug/title are resolved at runtime so renaming a
 * project never leaves stale links behind.
 */
export interface ParentLink {
  /** Document id of the project listing. */
  id: string;
  /** Id of the matching row in the project's `units`. When set, size, rooms,
   *  floor, facing, price and availability come from that unit. */
  unitId?: string;
}

/* ── Contact ───────────────────────────────────────────────────── */

export interface ListingContact {
  /** Person or desk handling enquiries, e.g. "Rafiq Ahmed". */
  name?: string;
  /** e.g. "Sales Manager" */
  designation?: string;
  /** Agency / developer office, e.g. "Jonopod Properties". */
  company?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  /** Free text, e.g. "Sat–Thu, 10:00 AM – 7:00 PM". */
  hours?: string;
  /** Sales office / site office address. */
  address?: string;
}

/* ── Page sections ─────────────────────────────────────────────── */

/** Optional, admin-controlled blocks of the public detail page. */
export type BuiltInSectionType = 'specifications' | 'floorPlans' | 'satellite' | 'amenities' | 'location' | 'legal' | 'progress' | 'video';

export interface BuiltInSection {
  id: BuiltInSectionType;
  type: BuiltInSectionType;
  enabled: boolean;
}

/** Free-form block written by the admin (e.g. "Payment Plan"). */
export interface CustomSection {
  id: string;
  type: 'custom';
  enabled: boolean;
  /** Heading (English). */
  title: string;
  /** Body text (Bangla). */
  body: string;
  imageUrl?: string;
}

export type ListingSection = BuiltInSection | CustomSection;

export interface Listing {
  id: string;
  slug: string;
  kind: ListingKind;
  /** Set when this listing is one home inside a multi-unit project. */
  parent?: ParentLink;
  category: ListingCategory;
  publish: PublishState;
  construction: ConstructionState;
  featured: boolean;

  /** Display name (English). */
  title: string;
  /** Controls whether the property displays its name ('name', default) or asking price ('price') as the primary title. */
  titleMode?: TitleMode;
  /** @deprecated Single-language titles are used now; kept for legacy documents. */
  titleBn?: string;
  /** @deprecated No longer edited or displayed. */
  taglineBn?: string;
  /** Property description (Bangla). */
  summary: string;

  location: {
    /** @deprecated Single-language area names are used now. */
    areaBn?: string;
    area: string;
    city: string;
    address: string;
    mapEmbedUrl?: string;
  };

  price: {
    /** Minimum / primary numeric price in BDT. For projects, if > 0 this overrides the lowest available unit price. */
    amount: number;
    /** Optional maximum numeric price in BDT when displaying a price range (e.g. ৳ ১.৮ কোটি – ২.৫ কোটি). */
    maxAmount?: number;
    /** Optional custom formatted price text in Bangla (e.g. "৳ ২.৮৫ কোটি" or "৳ ১.৮ কোটি – ২.৫ কোটি"). */
    label?: string;
    negotiable: boolean;
  };

  core: CoreSpecs;
  facts: Fact[];
  units: Unit[];

  media: {
    hero: MediaImage;
    gallery: MediaImage[];
    floorPlans: MediaImage[];
    satelliteImage?: MediaImage;
    videoUrl?: string;
  };

  /** @deprecated Editorial chapters are no longer edited or displayed. */
  chapters?: StoryChapter[];
  nearby: NearbyPlace[];
  amenities: AmenityItem[];

  /** Order and visibility of optional page sections. Resolve with `resolveSections()`. */
  sections?: ListingSection[];

  trust: {
    developer: string;
    rajukApproval?: string;
    landTitle?: string;
    milestones: Milestone[];
  };

  contact: ListingContact;

  seo?: {
    title?: string;
    description?: string;
  };

  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  apartment: 'Apartment',
  duplex: 'Duplex',
  penthouse: 'Penthouse',
  house: 'House',
  commercial: 'Commercial',
  land: 'Land',
};

export const CONSTRUCTION_LABELS: Record<ConstructionState, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Under Construction',
  ready: 'Ready to Move',
};

export const NEARBY_LABELS: Record<NearbyType, string> = {
  school: 'School',
  hospital: 'Hospital',
  mosque: 'Mosque',
  market: 'Market',
  park: 'Park',
  transit: 'Transit',
  other: 'Landmark',
};

/** Canonical order of the optional page sections. */
export const BUILT_IN_SECTION_TYPES: BuiltInSectionType[] = [
  'specifications',
  'floorPlans',
  'satellite',
  'amenities',
  'location',
  'legal',
  'progress',
  'video',
];

/** Sections switched on for a brand-new listing. The rest can be added from the editor. */
const NEW_LISTING_SECTIONS: ReadonlySet<BuiltInSectionType> = new Set(['video', 'floorPlans', 'satellite', 'amenities', 'location', 'legal']);

export function defaultSectionsForNew(): ListingSection[] {
  return BUILT_IN_SECTION_TYPES.map((type) => ({ id: type, type, enabled: NEW_LISTING_SECTIONS.has(type) }));
}

export function emptyListing(uid = ''): Listing {
  const now = new Date().toISOString();
  return {
    id: '',
    slug: '',
    kind: 'single',
    category: 'apartment',
    publish: 'draft',
    construction: 'ready',
    featured: false,
    title: '',
    titleMode: 'name',
    summary: '',
    location: { area: '', city: 'Dhaka', address: '' },
    price: { amount: 0, negotiable: false },
    core: {},
    facts: [],
    units: [],
    media: { hero: { url: '' }, gallery: [], floorPlans: [] },
    nearby: [],
    amenities: [],
    sections: defaultSectionsForNew(),
    trust: { developer: '', milestones: [] },
    contact: { phone: '' },
    seo: {},
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
  };
}
