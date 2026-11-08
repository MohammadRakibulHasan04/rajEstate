/* ------------------------------------------------------------------
   LISTING MODEL
   A listing is either a single property (one flat / house / plot) or a
   project (a building containing many units). Every fact is ranked by
   significance so the detail page can give it the weight it deserves.
------------------------------------------------------------------- */

export type ListingKind = 'single' | 'project';
export type PublishState = 'draft' | 'published' | 'archived';
export type ConstructionState = 'upcoming' | 'ongoing' | 'ready';
export type ListingCategory = 'apartment' | 'duplex' | 'penthouse' | 'house' | 'commercial' | 'land';

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

  title: string;
  titleBn: string;
  taglineBn: string;
  summary: string;

  location: {
    areaBn: string;
    area: string;
    city: string;
    address: string;
    mapEmbedUrl?: string;
  };

  price: {
    /** For projects this is ignored in favour of the lowest available unit. */
    amount: number;
    negotiable: boolean;
  };

  core: CoreSpecs;
  facts: Fact[];
  units: Unit[];

  media: {
    hero: MediaImage;
    gallery: MediaImage[];
    floorPlans: MediaImage[];
    videoUrl?: string;
  };

  chapters: StoryChapter[];
  nearby: NearbyPlace[];
  amenities: AmenityItem[];

  trust: {
    developer: string;
    rajukApproval?: string;
    landTitle?: string;
    milestones: Milestone[];
  };

  contact: {
    phone: string;
    whatsapp?: string;
    email?: string;
  };

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
    titleBn: '',
    taglineBn: '',
    summary: '',
    location: { areaBn: '', area: '', city: 'Dhaka', address: '' },
    price: { amount: 0, negotiable: false },
    core: {},
    facts: [],
    units: [],
    media: { hero: { url: '' }, gallery: [], floorPlans: [] },
    chapters: [],
    nearby: [],
    amenities: [],
    trust: { developer: '', milestones: [] },
    contact: { phone: '' },
    seo: {},
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
  };
}
