/* ------------------------------------------------------------------
   PROJECT ⇄ APARTMENT HIERARCHY
   A project listing owns the inventory (its `units` table). An apartment
   listing can point at the project (and optionally one unit) through
   `parent`. On the apartment page the two are merged:
   - unit-level facts (size, rooms, floor, facing, price, availability)
     always come from the project's unit row, so there is one source of truth
   - anything the apartment leaves empty (location, developer, contact,
     amenities, nearby places, hero image…) is inherited from the project
------------------------------------------------------------------- */
import { Listing, Unit } from '../types/listing';
import { slugify } from './format';

/** The project's unit row this apartment is linked to, if any. */
export function linkedUnit(child: Listing, parent: Listing | null | undefined): Unit | undefined {
  if (!parent || !child.parent?.unitId) return undefined;
  return parent.units.find((u) => u.id === child.parent!.unitId);
}

const pick = (own: string | undefined, inherited: string | undefined) => (own && own.trim() ? own : inherited);

/** Returns the apartment as visitors should see it, with project data folded in. */
export function withParent(child: Listing, parent: Listing | null | undefined): Listing {
  if (!parent || !child.parent || child.parent.id !== parent.id) return child;
  const unit = linkedUnit(child, parent);
  const core = { ...child.core };

  if (unit) {
    core.sizeSqft = unit.sizeSqft || core.sizeSqft;
    core.beds = unit.beds || core.beds;
    core.baths = unit.baths || core.baths;
    core.balconies = unit.balconies || core.balconies;
    core.floor = unit.floor || core.floor;
    core.facing = unit.facing || core.facing;
  }
  core.totalFloors = core.totalFloors || parent.core.totalFloors;
  core.handover = core.handover || parent.core.handover;
  core.parking = core.parking ?? parent.core.parking;
  core.landKatha = core.landKatha ?? parent.core.landKatha;

  const unitPlan = unit?.floorPlanUrl ? [{ url: unit.floorPlanUrl, caption: `Unit ${unit.code} plan` }] : [];

  return {
    ...child,
    construction: parent.construction,
    core,
    price: unit && unit.price > 0 ? { ...child.price, amount: unit.price } : child.price,
    location: {
      area: pick(child.location.area, parent.location.area) || '',
      areaBn: pick(child.location.areaBn, parent.location.areaBn) || '',
      city: pick(child.location.city, parent.location.city) || '',
      address: pick(child.location.address, parent.location.address) || '',
      mapEmbedUrl: pick(child.location.mapEmbedUrl, parent.location.mapEmbedUrl),
    },
    trust: {
      developer: pick(child.trust.developer, parent.trust.developer) || '',
      rajukApproval: pick(child.trust.rajukApproval, parent.trust.rajukApproval),
      landTitle: pick(child.trust.landTitle, parent.trust.landTitle),
      milestones: child.trust.milestones.length ? child.trust.milestones : parent.trust.milestones,
    },
    contact: child.contact.phone?.trim() ? child.contact : parent.contact,
    amenities: child.amenities.length ? child.amenities : parent.amenities,
    nearby: child.nearby.length ? child.nearby : parent.nearby,
    media: {
      ...child.media,
      hero: child.media.hero.url ? child.media.hero : parent.media.hero,
      floorPlans: child.media.floorPlans.length ? child.media.floorPlans : unitPlan,
      videoUrl: child.media.videoUrl || parent.media.videoUrl,
    },
  };
}

/** Apartment listings that are linked to a unit of this project: unitId → listing. */
export function unitPageMap(children: Listing[]): Record<string, Listing> {
  const map: Record<string, Listing> = {};
  for (const c of children) if (c.parent?.unitId) map[c.parent.unitId] = c;
  return map;
}

/** Top-level listings only (projects and standalone homes), for portfolio grids. */
export function isTopLevel(l: Listing): boolean {
  return !l.parent;
}

/**
 * A fresh draft apartment for one unit of a project. Inheritable fields are
 * deliberately left empty so they keep following the project.
 */
export function draftFromUnit(project: Listing, unit: Unit, uid: string): Listing {
  const now = new Date().toISOString();
  return {
    id: '',
    slug: `${project.slug}-${slugify(unit.code)}`.slice(0, 80).replace(/-+$/, ''),
    kind: 'single',
    parent: { id: project.id, unitId: unit.id },
    category: project.category === 'land' || project.category === 'commercial' ? project.category : 'apartment',
    publish: 'draft',
    construction: project.construction,
    featured: false,
    title: `${project.title} · Unit ${unit.code}`,
    titleBn: project.titleBn ? `${project.titleBn} · ইউনিট ${unit.code}` : '',
    taglineBn: '',
    summary: '',
    location: { areaBn: '', area: '', city: '', address: '' },
    price: { amount: 0, negotiable: project.price.negotiable },
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
