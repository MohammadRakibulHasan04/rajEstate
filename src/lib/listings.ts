/* ------------------------------------------------------------------
   LISTINGS DATA LAYER (Firestore: /listings)
------------------------------------------------------------------- */
import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Fact, Listing, MediaImage, PublishState, Unit } from '../types/listing';
import { normalizeAmenities } from './amenities';
import { SEED_LISTINGS } from '../data/seedListings';
import { TourInquiry } from '../types/property';
import { draftFromUnit } from './hierarchy';
import { normalizeContact } from './contact';
import { normalizeSections } from './sections';
import { customFacts, fallbackListingName } from './significance';

const COL = 'listings';

/** Firestore rejects `undefined`; a JSON round-trip strips it. */
function clean<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function normalizeUnit(u: Partial<Unit>, fallbackBalconies?: number): Unit {
  const baths = typeof u.baths === 'number' && !Number.isNaN(u.baths) ? u.baths : Number(u.baths) || 0;
  const rawBalc = u.balconies;
  const balconies =
    typeof rawBalc === 'number' && !Number.isNaN(rawBalc)
      ? rawBalc
      : rawBalc !== undefined && rawBalc !== null && String(rawBalc).trim() !== ''
        ? Number(rawBalc) || 0
        : fallbackBalconies ?? (baths > 0 ? baths : 2);
  return {
    id: String(u.id || ''),
    code: String(u.code || ''),
    floor: typeof u.floor === 'number' && !Number.isNaN(u.floor) ? u.floor : Number(u.floor) || 1,
    sizeSqft: typeof u.sizeSqft === 'number' && !Number.isNaN(u.sizeSqft) ? u.sizeSqft : Number(u.sizeSqft) || 0,
    beds: typeof u.beds === 'number' && !Number.isNaN(u.beds) ? u.beds : Number(u.beds) || 0,
    baths,
    balconies,
    facing: String(u.facing || 'South'),
    price: typeof u.price === 'number' && !Number.isNaN(u.price) ? u.price : Number(u.price) || 0,
    status: u.status === 'booked' || u.status === 'sold' ? u.status : 'available',
    ...(u.floorPlanUrl ? { floorPlanUrl: String(u.floorPlanUrl) } : {}),
  };
}

function fromDoc(id: string, data: Record<string, unknown>): Listing {
  const l = data as unknown as Listing;
  const rawContact = normalizeContact(l.contact);
  const contact = {
    ...rawContact,
    ...(rawContact.email === 'info@aura.com.bd' ? { email: 'info@jonopodproperties.com' } : {}),
  };
  const seo = l.seo
    ? {
        ...l.seo,
        title: l.seo.title ? l.seo.title.replace(/\|\s*AURA\b/gi, '| Jonopod Properties') : l.seo.title,
        description: l.seo.description ? l.seo.description.replace(/\bwith AURA\b/gi, 'with Jonopod Properties') : l.seo.description,
      }
    : undefined;
  return {
    ...l,
    id,
    title: typeof l.title === 'string' ? l.title : '',
    titleMode: l.titleMode === 'price' ? 'price' : 'name',
    summary: typeof l.summary === 'string' ? l.summary : '',
    facts: Array.isArray(l.facts) ? l.facts : [],
    units: Array.isArray(l.units) ? l.units.map((u) => normalizeUnit(u, l.core?.balconies)) : [],
    chapters: Array.isArray(l.chapters) ? l.chapters : [],
    nearby: Array.isArray(l.nearby) ? l.nearby : [],
    amenities: normalizeAmenities(l.amenities),
    sections: normalizeSections(l.sections),
    media: {
      hero: l.media?.hero || { url: '' },
      gallery: Array.isArray(l.media?.gallery) ? l.media.gallery : [],
      floorPlans: Array.isArray(l.media?.floorPlans) ? l.media.floorPlans : [],
      ...(l.media?.satelliteImage?.url ? { satelliteImage: l.media.satelliteImage } : {}),
      videoUrl: l.media?.videoUrl,
    },
    location: l.location || { area: '', city: 'Dhaka', address: '' },
    price: {
      amount: typeof l.price?.amount === 'number' && !Number.isNaN(l.price.amount) ? l.price.amount : Number(l.price?.amount) || 0,
      ...(typeof l.price?.maxAmount === 'number' && l.price.maxAmount > 0
        ? { maxAmount: l.price.maxAmount }
        : Number(l.price?.maxAmount) > 0
          ? { maxAmount: Number(l.price?.maxAmount) }
          : {}),
      negotiable: Boolean(l.price?.negotiable),
      ...(typeof l.price?.label === 'string' && l.price.label.trim() ? { label: l.price.label.trim() } : {}),
    },
    core: l.core || {},
    trust: {
      ...(l.trust || {}),
      developer: typeof l.trust?.developer === 'string' ? l.trust.developer : '',
      milestones: Array.isArray(l.trust?.milestones) ? l.trust.milestones : [],
    },
    contact,
    ...(seo ? { seo } : {}),
  };
}

/**
 * Normalises a listing before it is written:
 * - photos from legacy editorial chapters are moved into the gallery so none are lost
 * - deprecated fields (Bangla titles, tagline, chapters, Bangla captions) are dropped
 * - only admin-written specifications are stored; core facts are derived at runtime
 * - contact, sections and amenities are trimmed and validated
 */
export function sanitizeListing(l: Listing): Listing {
  const { titleBn: _t, taglineBn: _g, chapters, ...rest } = l;
  const stripCaption = ({ captionBn: _c, ...img }: MediaImage): MediaImage => ({ ...img, url: img.url.trim() });

  const hero = stripCaption(l.media.hero);
  const seen = new Set<string>(hero.url ? [hero.url] : []);
  const gallery: MediaImage[] = [];
  for (const img of l.media.gallery.map(stripCaption)) {
    if (!img.url || seen.has(img.url)) continue;
    seen.add(img.url);
    gallery.push(img);
  }
  for (const ch of chapters ?? []) {
    const url = ch?.imageUrl?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    gallery.push({ url, room: ch.kicker?.replace(/^The\s+/i, '') || undefined, caption: ch.titleEn || undefined });
  }

  const { areaBn: _a, ...location } = l.location;
  const facts: Fact[] = customFacts(l).map((f) => ({ key: f.key, label: f.label.trim(), value: f.value.trim(), tier: 'reference' }));
  const rawSat = l.media.satelliteImage;
  const satelliteImage = rawSat?.url?.trim() ? stripCaption(rawSat) : undefined;

  const titleMode = l.titleMode === 'price' ? 'price' : 'name';
  const trimmedTitle = l.title.trim();
  const resolvedTitle = trimmedTitle || (titleMode === 'price' ? fallbackListingName(l) : '');

  return {
    ...rest,
    title: resolvedTitle,
    titleMode,
    summary: l.summary.trim(),
    price: {
      amount: Math.max(0, Number(l.price?.amount) || 0),
      ...(Number(l.price?.maxAmount) > 0 ? { maxAmount: Math.max(0, Number(l.price?.maxAmount) || 0) } : {}),
      negotiable: Boolean(l.price?.negotiable),
      ...(l.price?.label?.trim() ? { label: l.price.label.trim() } : {}),
    },
    location: { ...location, area: location.area.trim(), city: location.city.trim(), address: location.address.trim() },
    units: Array.isArray(l.units) ? l.units.map((u) => normalizeUnit(u, l.core?.balconies)) : [],
    facts,
    media: {
      hero,
      gallery,
      floorPlans: l.media.floorPlans.map(stripCaption).filter((p) => p.url),
      ...(satelliteImage ? { satelliteImage } : {}),
      ...(l.media.videoUrl?.trim() ? { videoUrl: l.media.videoUrl.trim() } : {}),
    },
    nearby: l.nearby.filter((p) => p.name.trim()),
    amenities: normalizeAmenities(l.amenities).filter((a) => a.label.trim()),
    trust: { ...l.trust, milestones: l.trust.milestones.filter((m) => m.label.trim()) },
    sections: normalizeSections(l.sections),
    contact: normalizeContact(l.contact),
  };
}

export const PUBLISHED_SEEDS = SEED_LISTINGS.filter((l) => l.publish === 'published');

/* ── Smart In-Memory + Session Cache ───────────────────────────── */

const SESSION_CACHE_KEY = 'jonopod_listings_cache_v2';

interface ListingsCache {
  published: { listings: Listing[]; fromSeed: boolean } | null;
  all: Listing[] | null;
  byId: Map<string, Listing>;
  bySlug: Map<string, Listing>;
  childrenByParent: Map<string, Listing[]>;
  inquiries: TourInquiry[] | null;
  hasFirestoreData: boolean;
}

const cache: ListingsCache = {
  published: null,
  all: null,
  byId: new Map(),
  bySlug: new Map(),
  childrenByParent: new Map(),
  inquiries: null,
  hasFirestoreData: false,
};

function indexListing(l: Listing) {
  if (!l) return;
  if (l.id) cache.byId.set(l.id, l);
  if (l.slug) cache.bySlug.set(l.slug, l);
}

function indexListings(list: Listing[]) {
  list.forEach(indexListing);
}

function rebuildParentIndex(list: Listing[]) {
  cache.childrenByParent.clear();
  const map = new Map<string, Listing[]>();
  for (const l of list) {
    if (l.parent?.id) {
      map.set(l.parent.id, [...(map.get(l.parent.id) ?? []), l]);
    }
  }
  for (const [k, v] of map.entries()) {
    cache.childrenByParent.set(k, v);
  }
}

function persistSessionCache() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const payload = {
      published: cache.published,
      items: Array.from(cache.byId.values()),
      hasFirestoreData: cache.hasFirestoreData,
    };
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage quota / privacy errors
  }
}

// Hydrate cache on module load from seeds + sessionStorage
(() => {
  indexListings(SEED_LISTINGS);
  if (typeof sessionStorage === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.hasFirestoreData) {
      cache.hasFirestoreData = true;
      for (const [k, v] of cache.byId.entries()) {
        if (k.startsWith('seed-')) {
          cache.byId.delete(k);
          if (cache.bySlug.get(v.slug)?.id === k) cache.bySlug.delete(v.slug);
        }
      }
    }
    if (Array.isArray(parsed?.items)) {
      indexListings(parsed.items);
      rebuildParentIndex(parsed.items);
    }
    if (parsed?.published && Array.isArray(parsed.published.listings)) {
      cache.published = parsed.published;
      indexListings(parsed.published.listings);
    }
  } catch {
    // ignore
  }
})();

function getCachedBySlug(slug: string, isAdmin: boolean): Listing | null {
  const hit = cache.bySlug.get(slug);
  if (hit && (hit.publish === 'published' || isAdmin)) {
    return hit;
  }
  return null;
}

function getCachedChildren(parentId: string | undefined, isAdmin: boolean): Listing[] | null {
  if (!parentId) return [];
  const hit = cache.childrenByParent.get(parentId);
  if (!hit) return null;
  return isAdmin ? hit : hit.filter((l) => l.publish === 'published');
}

/* ── Shared Published Subscription ─────────────────────────────── */

type PublishedState = { listings: Listing[]; loading: boolean; fromSeed: boolean };
const publishedSubscribers = new Set<(s: PublishedState) => void>();
let publishedUnsub: (() => void) | null = null;

function notifyPublished(next: PublishedState) {
  publishedSubscribers.forEach((cb) => cb(next));
}

/** Keeps all cache layers and live subscribers consistent after a write/delete. */
function upsertInCache(item: Listing, previousSlug?: string) {
  cache.hasFirestoreData = true;
  if (previousSlug && previousSlug !== item.slug) {
    cache.bySlug.delete(previousSlug);
  }
  // Remove any seed placeholder sharing the same slug
  for (const [k, v] of cache.byId.entries()) {
    if (k.startsWith('seed-') && (v.slug === item.slug || v.slug === previousSlug)) {
      cache.byId.delete(k);
    }
  }
  indexListing(item);

  if (cache.all) {
    const filtered = cache.all.filter(
      (l) => l.id !== item.id && !(l.id.startsWith('seed-') && (l.slug === item.slug || l.slug === previousSlug))
    );
    cache.all = sortListings([...filtered, item]);
  }

  const basePublished = cache.published?.fromSeed ? [] : (cache.published?.listings ?? []);
  const withoutCurrent = basePublished.filter(
    (l) => l.id !== item.id && !(l.id.startsWith('seed-') && (l.slug === item.slug || l.slug === previousSlug))
  );
  const nextPublished = item.publish === 'published' ? sortListings([...withoutCurrent, item]) : sortListings(withoutCurrent);
  cache.published = { listings: nextPublished, fromSeed: false };
  notifyPublished({ listings: nextPublished, loading: false, fromSeed: false });

  rebuildParentIndex(Array.from(cache.byId.values()));
  persistSessionCache();
}

function removeFromCache(id: string) {
  cache.hasFirestoreData = true;
  const prev = cache.byId.get(id);
  cache.byId.delete(id);
  if (prev?.slug) {
    cache.bySlug.delete(prev.slug);
    for (const [k, v] of cache.byId.entries()) {
      if (k.startsWith('seed-') && v.slug === prev.slug) {
        cache.byId.delete(k);
      }
    }
  }
  if (cache.all) {
    cache.all = cache.all.filter((l) => l.id !== id && !(prev?.slug && l.id.startsWith('seed-') && l.slug === prev.slug));
  }
  if (cache.published) {
    const nextPub = cache.published.listings.filter(
      (l) => l.id !== id && !(prev?.slug && l.id.startsWith('seed-') && l.slug === prev.slug)
    );
    cache.published = { listings: nextPub, fromSeed: false };
    notifyPublished({ listings: nextPub, loading: false, fromSeed: false });
  }
  cache.childrenByParent.delete(id);
  rebuildParentIndex(Array.from(cache.byId.values()));
  persistSessionCache();
}

function ensurePublishedSubscription() {
  if (publishedUnsub) return;
  const q = query(collection(db, COL), where('publish', '==', 'published'));
  publishedUnsub = onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => fromDoc(d.id, d.data()));
      if (list.length) {
        cache.hasFirestoreData = true;
        const sorted = sortListings(list);
        cache.published = { listings: sorted, fromSeed: false };
        indexListings(sorted);
        rebuildParentIndex(Array.from(cache.byId.values()));
        persistSessionCache();
        notifyPublished({ listings: sorted, loading: false, fromSeed: false });
      } else if (cache.hasFirestoreData || (cache.all && cache.all.length > 0)) {
        cache.published = { listings: [], fromSeed: false };
        persistSessionCache();
        notifyPublished({ listings: [], loading: false, fromSeed: false });
      } else {
        cache.published = { listings: PUBLISHED_SEEDS, fromSeed: true };
        indexListings(PUBLISHED_SEEDS);
        persistSessionCache();
        notifyPublished({ listings: PUBLISHED_SEEDS, loading: false, fromSeed: true });
      }
    },
    (err) => {
      console.warn('Published listings unavailable, using seeds:', err.message);
      if (!cache.published) {
        cache.published = { listings: PUBLISHED_SEEDS, fromSeed: true };
      }
      notifyPublished({ listings: cache.published.listings, loading: false, fromSeed: cache.published.fromSeed });
    }
  );
}

/* ── Reads ─────────────────────────────────────────────────────── */

/**
 * Public listings. Serves instantly from memory/session cache when
 * navigating back, while staying live via a shared Firestore listener.
 */
export function usePublishedListings() {
  const [state, setState] = useState<PublishedState>(() =>
    cache.published
      ? { listings: cache.published.listings, loading: false, fromSeed: cache.published.fromSeed }
      : { listings: [], loading: true, fromSeed: false }
  );

  useEffect(() => {
    publishedSubscribers.add(setState);
    ensurePublishedSubscription();
    if (cache.published) {
      setState({ listings: cache.published.listings, loading: false, fromSeed: cache.published.fromSeed });
    }
    return () => {
      publishedSubscribers.delete(setState);
    };
  }, []);

  return state;
}

/** Admin: every listing in any state. */
export function useAllListings(enabled: boolean) {
  const [state, setState] = useState<{ listings: Listing[]; loading: boolean; error: string | null }>(() =>
    cache.all
      ? { listings: cache.all, loading: false, error: null }
      : { listings: [], loading: true, error: null }
  );

  useEffect(() => {
    if (!enabled) return;
    if (cache.all) {
      setState({ listings: cache.all, loading: false, error: null });
    }
    return onSnapshot(
      collection(db, COL),
      (snap) => {
        const docs = snap.docs.map((d) => fromDoc(d.id, d.data()));
        if (docs.length > 0) {
          cache.hasFirestoreData = true;
          for (const [k, v] of cache.byId.entries()) {
            if (k.startsWith('seed-')) {
              cache.byId.delete(k);
              if (cache.bySlug.get(v.slug)?.id === k) {
                cache.bySlug.delete(v.slug);
              }
            }
          }
        }
        const sorted = sortListings(docs);
        cache.all = sorted;
        indexListings(sorted);
        rebuildParentIndex(sorted);
        if (cache.hasFirestoreData) {
          const pub = sorted.filter((l) => l.publish === 'published');
          cache.published = { listings: pub, fromSeed: false };
          notifyPublished({ listings: pub, loading: false, fromSeed: false });
        }
        persistSessionCache();
        setState({ listings: sorted, loading: false, error: null });
      },
      (err) => setState((prev) => ({ listings: prev.listings, loading: false, error: err.message }))
    );
  }, [enabled]);

  return state;
}

function sortListings(list: Listing[]) {
  return [...list].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return (b.updatedAt || '').localeCompare(a.updatedAt || '');
  });
}

/**
 * Loads one listing by slug. Renders immediately from cache if already
 * loaded from the showcase or a previous visit, and updates live.
 */
export function useListingBySlug(slug: string, isAdmin: boolean) {
  const [state, setState] = useState<{ listing: Listing | null; loading: boolean }>(() => {
    const cached = getCachedBySlug(slug, isAdmin);
    return cached ? { listing: cached, loading: false } : { listing: null, loading: true };
  });

  useEffect(() => {
    const cached = getCachedBySlug(slug, isAdmin);
    if (cached) {
      setState({ listing: cached, loading: false });
    } else {
      setState({ listing: null, loading: true });
    }

    const constraints = isAdmin
      ? [where('slug', '==', slug), limit(1)]
      : [where('slug', '==', slug), where('publish', '==', 'published'), limit(1)];

    return onSnapshot(
      query(collection(db, COL), ...constraints),
      (snap) => {
        if (!snap.empty) {
          const docItem = fromDoc(snap.docs[0].id, snap.docs[0].data());
          upsertInCache(docItem);
          setState({ listing: docItem, loading: false });
        } else {
          // Only fall back to seeds if Firestore has not been populated/mutated
          const knownInCache = cache.bySlug.get(slug);
          const blockedByStatus = knownInCache && !knownInCache.id.startsWith('seed-') && knownInCache.publish !== 'published' && !isAdmin;
          const allowSeed = !cache.hasFirestoreData && !blockedByStatus;
          const seed = allowSeed
            ? SEED_LISTINGS.find((l) => l.slug === slug && (l.publish === 'published' || isAdmin))
            : undefined;
          setState({ listing: seed ?? null, loading: false });
        }
      },
      (err) => {
        console.warn('Listing lookup failed, trying cache/seed:', err.message);
        const seed = !cache.hasFirestoreData
          ? SEED_LISTINGS.find((l) => l.slug === slug && (l.publish === 'published' || isAdmin))
          : undefined;
        setState({ listing: getCachedBySlug(slug, isAdmin) ?? seed ?? null, loading: false });
      }
    );
  }, [slug, isAdmin]);

  return state;
}

export function useListingById(id: string | null) {
  const [state, setState] = useState<{ listing: Listing | null; loading: boolean }>(() => {
    if (!id) return { listing: null, loading: false };
    const cached = cache.byId.get(id);
    return cached ? { listing: cached, loading: false } : { listing: null, loading: true };
  });

  useEffect(() => {
    if (!id) {
      setState({ listing: null, loading: false });
      return;
    }
    const cached = cache.byId.get(id);
    if (cached) {
      setState({ listing: cached, loading: false });
    } else {
      setState({ listing: null, loading: true });
    }
    return onSnapshot(
      doc(db, COL, id),
      (snap) => {
        if (snap.exists()) {
          const item = fromDoc(snap.id, snap.data());
          upsertInCache(item);
          setState({ listing: item, loading: false });
        } else {
          const seed = SEED_LISTINGS.find((l) => l.id === id) ?? null;
          setState({ listing: seed, loading: false });
        }
      },
      () => setState({ listing: cache.byId.get(id) ?? null, loading: false })
    );
  }, [id]);
  return state;
}

/**
 * Public-safe lookup of a project by id (used by apartment pages).
 * Serves immediately from cache when available.
 */
export function useParentListing(id: string | undefined) {
  const [state, setState] = useState<{ listing: Listing | null; loading: boolean }>(() => {
    if (!id) return { listing: null, loading: false };
    const cached = cache.byId.get(id);
    return cached ? { listing: cached, loading: false } : { listing: null, loading: true };
  });

  useEffect(() => {
    if (!id) {
      setState({ listing: null, loading: false });
      return;
    }
    const cached = cache.byId.get(id);
    if (cached) {
      setState({ listing: cached, loading: false });
    } else {
      setState((s) => ({ ...s, loading: true }));
    }
    const seed = SEED_LISTINGS.find((l) => l.id === id) ?? null;
    return onSnapshot(
      doc(db, COL, id),
      (snap) => {
        if (snap.exists()) {
          const item = fromDoc(snap.id, snap.data());
          upsertInCache(item);
          setState({ listing: item, loading: false });
        } else {
          setState({ listing: seed, loading: false });
        }
      },
      () => setState({ listing: cache.byId.get(id) ?? seed, loading: false })
    );
  }, [id]);
  return state;
}

/**
 * Apartment listings that belong to a project. Serves immediately from cache
 * when available and stays synced via Firestore.
 */
export function useChildListings(parentId: string | undefined, isAdmin: boolean) {
  const [state, setState] = useState<{ listings: Listing[]; loading: boolean }>(() => {
    if (!parentId) return { listings: [], loading: false };
    const cached = getCachedChildren(parentId, isAdmin);
    return cached ? { listings: cached, loading: false } : { listings: [], loading: true };
  });

  useEffect(() => {
    if (!parentId) {
      setState({ listings: [], loading: false });
      return;
    }
    const cached = getCachedChildren(parentId, isAdmin);
    if (cached) {
      setState({ listings: cached, loading: false });
    }
    const seeds = SEED_LISTINGS.filter(
      (l) => l.parent?.id === parentId && (l.publish === 'published' || isAdmin)
    );
    const constraints = isAdmin
      ? [where('parent.id', '==', parentId)]
      : [where('parent.id', '==', parentId), where('publish', '==', 'published')];
    return onSnapshot(
      query(collection(db, COL), ...constraints),
      (snap) => {
        const list = snap.docs.map((d) => fromDoc(d.id, d.data()));
        const resolved = list.length ? list : (!cache.hasFirestoreData ? seeds : []);
        indexListings(resolved);
        cache.childrenByParent.set(parentId, resolved);
        persistSessionCache();
        setState({ listings: resolved, loading: false });
      },
      (err) => {
        console.warn('Child listings unavailable, using cache/seeds:', err.message);
        setState({ listings: cached ?? seeds, loading: false });
      }
    );
  }, [parentId, isAdmin]);
  return state;
}

/* ── Writes ────────────────────────────────────────────────────── */

export async function isSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const snap = await getDocs(query(collection(db, COL), where('slug', '==', slug), limit(2)));
  return snap.docs.some((d) => d.id !== exceptId);
}

/** Creates or updates. Returns the document id. */
export async function saveListing(listing: Listing, uid: string): Promise<string> {
  const now = new Date().toISOString();
  const prevSlug = listing.id ? cache.byId.get(listing.id)?.slug : undefined;
  const { id, ...rest } = sanitizeListing(listing);
  const payload = clean({ ...rest, updatedAt: now });
  try {
    if (id && !id.startsWith('seed-')) {
      await setDoc(doc(db, COL, id), payload);
      const updated = fromDoc(id, payload as unknown as Record<string, unknown>);
      upsertInCache(updated, prevSlug);
      return id;
    }
    const ref = await addDoc(collection(db, COL), { ...payload, createdAt: now, createdBy: uid });
    const created = fromDoc(ref.id, { ...payload, createdAt: now, createdBy: uid } as unknown as Record<string, unknown>);
    if (id && id.startsWith('seed-')) {
      cache.byId.delete(id);
    }
    upsertInCache(created, prevSlug);
    return ref.id;
  } catch (err) {
    handleFirestoreError(err, id && !id.startsWith('seed-') ? OperationType.UPDATE : OperationType.CREATE, id && !id.startsWith('seed-') ? `${COL}/${id}` : COL);
  }
}

export async function setPublishState(id: string, publish: PublishState, uid = 'admin'): Promise<string> {
  const now = new Date().toISOString();
  try {
    const prev = cache.byId.get(id);
    if (id.startsWith('seed-') && prev) {
      return await saveListing({ ...prev, publish }, uid);
    }
    if (prev) {
      // Sanitize and write full document so legacy documents also pass strict schema rules
      return await saveListing({ ...prev, publish, updatedAt: now }, prev.createdBy || uid);
    }
    await updateDoc(doc(db, COL, id), { publish, updatedAt: now });
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COL}/${id}`);
  }
}

export async function publishListing(id: string, uid = 'admin'): Promise<string> {
  return setPublishState(id, 'published', uid);
}

export async function unpublishListing(id: string, uid = 'admin'): Promise<string> {
  return setPublishState(id, 'draft', uid);
}

export async function archiveListing(id: string, uid = 'admin'): Promise<string> {
  return setPublishState(id, 'archived', uid);
}

export async function deleteListing(id: string) {
  try {
    if (id && !id.startsWith('seed-')) {
      await deleteDoc(doc(db, COL, id));
    }
    removeFromCache(id);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COL}/${id}`);
  }
}

export async function duplicateListing(l: Listing, uid: string): Promise<string> {
  let slug = `${l.slug}-copy`;
  let n = 2;
  while (await isSlugTaken(slug)) slug = `${l.slug}-copy-${n++}`;
  // A unit can only have one page, so a copied apartment keeps the project but not the unit.
  const parent = l.parent ? { id: l.parent.id } : undefined;
  return saveListing({ ...l, id: '', slug, parent, title: `${l.title} (Copy)`, publish: 'draft', featured: false }, uid);
}

/** Creates a draft apartment page for one unit of a project. Returns the new id. */
export async function createUnitListing(project: Listing, unit: Unit, uid: string): Promise<string> {
  const draft = draftFromUnit(project, unit, uid);
  let slug = draft.slug;
  let n = 2;
  while (await isSlugTaken(slug)) slug = `${draft.slug}-${n++}`;
  return saveListing({ ...draft, slug }, uid);
}

export async function seedListings(uid: string, which: Listing[] = SEED_LISTINGS) {
  // Projects first so apartments can be re-pointed at the real document ids.
  const ordered = [...which].sort((a, b) => Number(!!a.parent) - Number(!!b.parent));
  const idMap = new Map<string, string>();
  for (const l of ordered) {
    if (await isSlugTaken(l.slug)) continue;
    const parent = l.parent ? { ...l.parent, id: idMap.get(l.parent.id) ?? l.parent.id } : undefined;
    const newId = await saveListing({ ...l, id: '', parent }, uid);
    idMap.set(l.id, newId);
  }
}

/* ── Inquiries (admin inbox) ───────────────────────────────────── */

export function useInquiries(enabled: boolean) {
  const [state, setState] = useState<{ items: TourInquiry[]; loading: boolean; error: string | null }>(() =>
    cache.inquiries
      ? { items: cache.inquiries, loading: false, error: null }
      : { items: [], loading: true, error: null }
  );
  useEffect(() => {
    if (!enabled) return;
    if (cache.inquiries) {
      setState({ items: cache.inquiries, loading: false, error: null });
    }
    return onSnapshot(
      collection(db, 'inquiries'),
      (snap) => {
        const items = snap.docs
          .map((d) => ({ ...(d.data() as TourInquiry), id: d.id }))
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        cache.inquiries = items;
        setState({ items, loading: false, error: null });
      },
      (err) => setState((prev) => ({ items: prev.items, loading: false, error: err.message }))
    );
  }, [enabled]);
  return state;
}

export async function setInquiryStatus(id: string, status: TourInquiry['status']) {
  try {
    await updateDoc(doc(db, 'inquiries', id), { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `inquiries/${id}`);
  }
}
