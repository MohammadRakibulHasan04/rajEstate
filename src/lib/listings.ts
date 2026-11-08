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
import { Listing, PublishState, Unit } from '../types/listing';
import { normalizeAmenities } from './amenities';
import { SEED_LISTINGS } from '../data/seedListings';
import { TourInquiry } from '../types/property';
import { draftFromUnit } from './hierarchy';

const COL = 'listings';

/** Firestore rejects `undefined`; a JSON round-trip strips it. */
function clean<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function fromDoc(id: string, data: Record<string, unknown>): Listing {
  const l = data as unknown as Listing;
  return {
    ...l,
    id,
    facts: Array.isArray(l.facts) ? l.facts : [],
    units: Array.isArray(l.units) ? l.units : [],
    chapters: Array.isArray(l.chapters) ? l.chapters : [],
    nearby: Array.isArray(l.nearby) ? l.nearby : [],
    amenities: normalizeAmenities(l.amenities),
    media: {
      hero: l.media?.hero || { url: '' },
      gallery: Array.isArray(l.media?.gallery) ? l.media.gallery : [],
      floorPlans: Array.isArray(l.media?.floorPlans) ? l.media.floorPlans : [],
      videoUrl: l.media?.videoUrl,
    },
    location: l.location || { area: '', areaBn: '', city: 'Dhaka', address: '' },
    price: l.price || { amount: 0, negotiable: false },
    core: l.core || {},
    trust: l.trust || { developer: '', milestones: [] },
    contact: l.contact || { phone: '' },
  };
}

export const PUBLISHED_SEEDS = SEED_LISTINGS.filter((l) => l.publish === 'published');

/* ── Smart In-Memory + Session Cache ───────────────────────────── */

const SESSION_CACHE_KEY = 'aura_listings_cache_v1';

interface ListingsCache {
  published: { listings: Listing[]; fromSeed: boolean } | null;
  all: Listing[] | null;
  byId: Map<string, Listing>;
  bySlug: Map<string, Listing>;
  childrenByParent: Map<string, Listing[]>;
  inquiries: TourInquiry[] | null;
}

const cache: ListingsCache = {
  published: null,
  all: null,
  byId: new Map(),
  bySlug: new Map(),
  childrenByParent: new Map(),
  inquiries: null,
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
  if (hit && (hit.publish === 'published' || isAdmin || import.meta.env.DEV)) {
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

function ensurePublishedSubscription() {
  if (publishedUnsub) return;
  const q = query(collection(db, COL), where('publish', '==', 'published'));
  publishedUnsub = onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => fromDoc(d.id, d.data()));
      if (list.length) {
        const sorted = sortListings(list);
        cache.published = { listings: sorted, fromSeed: false };
        indexListings(sorted);
        rebuildParentIndex(sorted);
        persistSessionCache();
        notifyPublished({ listings: sorted, loading: false, fromSeed: false });
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
        const sorted = sortListings(snap.docs.map((d) => fromDoc(d.id, d.data())));
        cache.all = sorted;
        indexListings(sorted);
        rebuildParentIndex(sorted);
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
    const seed = SEED_LISTINGS.find(
      (l) => l.slug === slug && (l.publish === 'published' || isAdmin || import.meta.env.DEV)
    );

    return onSnapshot(
      query(collection(db, COL), ...constraints),
      (snap) => {
        if (!snap.empty) {
          const docItem = fromDoc(snap.docs[0].id, snap.docs[0].data());
          indexListing(docItem);
          persistSessionCache();
          setState({ listing: docItem, loading: false });
        } else {
          setState({ listing: seed ?? null, loading: false });
        }
      },
      (err) => {
        console.warn('Listing lookup failed, trying cache/seed:', err.message);
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
          indexListing(item);
          persistSessionCache();
          setState({ listing: item, loading: false });
        } else {
          setState({ listing: null, loading: false });
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
          indexListing(item);
          persistSessionCache();
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
      (l) => l.parent?.id === parentId && (l.publish === 'published' || isAdmin || import.meta.env.DEV)
    );
    const constraints = isAdmin
      ? [where('parent.id', '==', parentId)]
      : [where('parent.id', '==', parentId), where('publish', '==', 'published')];
    return onSnapshot(
      query(collection(db, COL), ...constraints),
      (snap) => {
        const list = snap.docs.map((d) => fromDoc(d.id, d.data()));
        const resolved = list.length ? list : seeds;
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
  const { id, ...rest } = listing;
  const payload = clean({ ...rest, updatedAt: now });
  try {
    if (id && !id.startsWith('seed-')) {
      await setDoc(doc(db, COL, id), payload);
      const updated = fromDoc(id, payload as unknown as Record<string, unknown>);
      indexListing(updated);
      persistSessionCache();
      return id;
    }
    const ref = await addDoc(collection(db, COL), { ...payload, createdAt: now, createdBy: uid });
    const created = fromDoc(ref.id, { ...payload, createdAt: now, createdBy: uid } as unknown as Record<string, unknown>);
    indexListing(created);
    persistSessionCache();
    return ref.id;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, id ? `${COL}/${id}` : COL);
  }
}

export async function setPublishState(id: string, publish: PublishState) {
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, COL, id), { publish, updatedAt: now });
    const prev = cache.byId.get(id);
    if (prev) {
      indexListing({ ...prev, publish, updatedAt: now });
      persistSessionCache();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COL}/${id}`);
  }
}

export async function deleteListing(id: string) {
  try {
    await deleteDoc(doc(db, COL, id));
    const prev = cache.byId.get(id);
    if (prev) {
      cache.byId.delete(id);
      cache.bySlug.delete(prev.slug);
      persistSessionCache();
    }
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
