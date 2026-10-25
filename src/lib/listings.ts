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
import { Listing, PublishState } from '../types/listing';
import { SEED_LISTINGS } from '../data/seedListings';
import { TourInquiry } from '../types/property';

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
    amenities: Array.isArray(l.amenities) ? l.amenities : [],
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

/* ── Reads ─────────────────────────────────────────────────────── */

/**
 * Public listings. Falls back to bundled seeds when the collection is
 * empty or unreachable (e.g. rules not yet deployed) so the site is
 * never blank.
 */
export function usePublishedListings() {
  const [state, setState] = useState<{ listings: Listing[]; loading: boolean; fromSeed: boolean }>({
    listings: [],
    loading: true,
    fromSeed: false,
  });

  useEffect(() => {
    const q = query(collection(db, COL), where('publish', '==', 'published'));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => fromDoc(d.id, d.data()));
        if (list.length) setState({ listings: sortListings(list), loading: false, fromSeed: false });
        else setState({ listings: PUBLISHED_SEEDS, loading: false, fromSeed: true });
      },
      (err) => {
        console.warn('Published listings unavailable, using seeds:', err.message);
        setState({ listings: PUBLISHED_SEEDS, loading: false, fromSeed: true });
      }
    );
  }, []);

  return state;
}

/** Admin: every listing in any state. */
export function useAllListings(enabled: boolean) {
  const [state, setState] = useState<{ listings: Listing[]; loading: boolean; error: string | null }>({
    listings: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(
      collection(db, COL),
      (snap) =>
        setState({ listings: sortListings(snap.docs.map((d) => fromDoc(d.id, d.data()))), loading: false, error: null }),
      (err) => setState({ listings: [], loading: false, error: err.message })
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
 * Loads one listing by slug. Non-admins may only query published docs
 * (the rules require the query itself to be constrained).
 */
export function useListingBySlug(slug: string, isAdmin: boolean) {
  const [state, setState] = useState<{ listing: Listing | null; loading: boolean }>({ listing: null, loading: true });

  useEffect(() => {
    setState({ listing: null, loading: true });
    const constraints = isAdmin
      ? [where('slug', '==', slug), limit(1)]
      : [where('slug', '==', slug), where('publish', '==', 'published'), limit(1)];
    const seed = SEED_LISTINGS.find(
      (l) => l.slug === slug && (l.publish === 'published' || isAdmin || import.meta.env.DEV)
    );

    return onSnapshot(
      query(collection(db, COL), ...constraints),
      (snap) => {
        if (!snap.empty) setState({ listing: fromDoc(snap.docs[0].id, snap.docs[0].data()), loading: false });
        else setState({ listing: seed ?? null, loading: false });
      },
      (err) => {
        console.warn('Listing lookup failed, trying seed:', err.message);
        setState({ listing: seed ?? null, loading: false });
      }
    );
  }, [slug, isAdmin]);

  return state;
}

export function useListingById(id: string | null) {
  const [state, setState] = useState<{ listing: Listing | null; loading: boolean }>({ listing: null, loading: !!id });
  useEffect(() => {
    if (!id) {
      setState({ listing: null, loading: false });
      return;
    }
    return onSnapshot(
      doc(db, COL, id),
      (snap) => setState({ listing: snap.exists() ? fromDoc(snap.id, snap.data()) : null, loading: false }),
      () => setState({ listing: null, loading: false })
    );
  }, [id]);
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
      return id;
    }
    const ref = await addDoc(collection(db, COL), { ...payload, createdAt: now, createdBy: uid });
    return ref.id;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, id ? `${COL}/${id}` : COL);
  }
}

export async function setPublishState(id: string, publish: PublishState) {
  try {
    await updateDoc(doc(db, COL, id), { publish, updatedAt: new Date().toISOString() });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COL}/${id}`);
  }
}

export async function deleteListing(id: string) {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COL}/${id}`);
  }
}

export async function duplicateListing(l: Listing, uid: string): Promise<string> {
  let slug = `${l.slug}-copy`;
  let n = 2;
  while (await isSlugTaken(slug)) slug = `${l.slug}-copy-${n++}`;
  return saveListing({ ...l, id: '', slug, title: `${l.title} (Copy)`, publish: 'draft', featured: false }, uid);
}

export async function seedListings(uid: string, which: Listing[] = SEED_LISTINGS) {
  for (const l of which) {
    if (await isSlugTaken(l.slug)) continue;
    await saveListing({ ...l, id: '' }, uid);
  }
}

/* ── Inquiries (admin inbox) ───────────────────────────────────── */

export function useInquiries(enabled: boolean) {
  const [state, setState] = useState<{ items: TourInquiry[]; loading: boolean; error: string | null }>({
    items: [],
    loading: true,
    error: null,
  });
  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(
      collection(db, 'inquiries'),
      (snap) => {
        const items = snap.docs
          .map((d) => ({ ...(d.data() as TourInquiry), id: d.id }))
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setState({ items, loading: false, error: null });
      },
      (err) => setState({ items: [], loading: false, error: err.message })
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
