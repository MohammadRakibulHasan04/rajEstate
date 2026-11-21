/* ------------------------------------------------------------------
   PAGE SECTIONS
   Admins decide which optional blocks appear on a listing page and in
   which order, and can add free-form custom sections. Everything here is
   pure so the editor and the public page share the same rules.
------------------------------------------------------------------- */
import {
  BUILT_IN_SECTION_TYPES,
  BuiltInSectionType,
  CustomSection,
  Listing,
  ListingSection,
} from '../types/listing';
import { customFacts } from './significance';
import { isImageUrl, isSafeHttpUrl } from './media';

export interface SectionMeta {
  label: string;
  navLabel: string;
  description: string;
}

export const SECTION_META: Record<BuiltInSectionType, SectionMeta> = {
  specifications: {
    label: 'Additional Specifications',
    navLabel: 'Specifications',
    description: 'Finishes, fittings and any detail not covered by the core specs.',
  },
  floorPlans: { label: 'Floor Plans', navLabel: 'Floor Plans', description: 'Dimensioned layout drawings.' },
  amenities: { label: 'Amenities', navLabel: 'Amenities', description: 'Building facilities and in-home features.' },
  location: {
    label: 'Location & Nearby',
    navLabel: 'Location',
    description: 'Map and travel times to schools, hospitals, markets and transit.',
  },
  legal: { label: 'Legal & Approvals', navLabel: 'Legal', description: 'Developer, RAJUK approval and land title.' },
  progress: { label: 'Construction Progress', navLabel: 'Progress', description: 'Milestone timeline for ongoing projects.' },
  video: { label: 'Video Tour', navLabel: 'Video', description: 'A YouTube or Vimeo walkthrough.' },
};

const isBuiltIn = (t: unknown): t is BuiltInSectionType =>
  typeof t === 'string' && (BUILT_IN_SECTION_TYPES as string[]).includes(t);
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** Documents saved before sections existed: everything on, so nothing that used to render disappears. */
function legacyDefaults(): ListingSection[] {
  return BUILT_IN_SECTION_TYPES.map((type) => ({ id: type, type, enabled: true }));
}

/**
 * Validates untrusted section data: drops unknown or duplicate entries and
 * appends any built-in section that is missing (switched off).
 */
export function normalizeSections(raw: unknown): ListingSection[] {
  if (!Array.isArray(raw)) return legacyDefaults();
  const out: ListingSection[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const s = item as Record<string, unknown>;
    if (s.type === 'custom') {
      const id = str(s.id);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const imageUrl = str(s.imageUrl).trim();
      out.push({
        id,
        type: 'custom',
        enabled: s.enabled !== false,
        title: str(s.title),
        body: str(s.body),
        ...(imageUrl ? { imageUrl } : {}),
      });
    } else if (isBuiltIn(s.type) && !seen.has(s.type)) {
      seen.add(s.type);
      out.push({ id: s.type, type: s.type, enabled: s.enabled !== false });
    }
  }

  for (const type of BUILT_IN_SECTION_TYPES) {
    if (!seen.has(type)) out.push({ id: type, type, enabled: false });
  }
  return out;
}

export const resolveSections = (l: Listing): ListingSection[] => normalizeSections(l.sections);

export function isSectionEnabled(l: Listing, type: BuiltInSectionType): boolean {
  return resolveSections(l).some((s) => s.type === type && s.enabled);
}

export function sectionHasContent(l: Listing, s: ListingSection): boolean {
  switch (s.type) {
    case 'specifications':
      return customFacts(l).length > 0;
    case 'floorPlans':
      return l.media.floorPlans.some((p) => isImageUrl(p.url));
    case 'amenities':
      return l.amenities.some((a) => a.label.trim());
    case 'location':
      return l.nearby.some((p) => p.name.trim()) || isSafeHttpUrl(l.location.mapEmbedUrl);
    case 'legal':
      return !!(l.trust.developer?.trim() || l.trust.rajukApproval?.trim() || l.trust.landTitle?.trim());
    case 'progress':
      return l.trust.milestones.some((m) => m.label.trim());
    case 'video':
      return !!l.media.videoUrl?.trim();
    case 'custom':
      return !!(s.title.trim() && (s.body.trim() || isImageUrl(s.imageUrl)));
  }
}

/** Enabled sections that have content, in admin order: exactly what the public page renders. */
export function visibleSections(l: Listing): ListingSection[] {
  return resolveSections(l).filter((s) => s.enabled && sectionHasContent(l, s));
}

export function sectionLabel(s: ListingSection): string {
  return s.type === 'custom' ? s.title.trim() || 'Untitled section' : SECTION_META[s.type].label;
}

/** DOM id of a section card in the editor. */
export const editorSectionId = (s: ListingSection) => `section-${s.id}`;

/** DOM id of a section on the public page (also used for in-page navigation). */
export const publicSectionId = (s: ListingSection) => (s.type === 'custom' ? s.id : s.type);

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function createCustomSection(): CustomSection {
  return { id: createId('custom'), type: 'custom', enabled: true, title: '', body: '' };
}

/* ── Pure list operations used by the editor ─────────────────────── */

/** Moves a section to just after the last enabled one. */
function placeAfterEnabled(list: ListingSection[], section: ListingSection): ListingSection[] {
  const rest = list.filter((s) => s.id !== section.id);
  let insertAt = 0;
  rest.forEach((s, i) => {
    if (s.enabled) insertAt = i + 1;
  });
  return [...rest.slice(0, insertAt), section, ...rest.slice(insertAt)];
}

export function enableSection(list: ListingSection[], id: string): ListingSection[] {
  const target = list.find((s) => s.id === id);
  if (!target || target.enabled) return list;
  return placeAfterEnabled(list, { ...target, enabled: true });
}

export function addCustomSection(list: ListingSection[], section: CustomSection = createCustomSection()): ListingSection[] {
  return placeAfterEnabled(list, section);
}

/** Built-in sections are switched off (content is kept); custom sections are deleted. */
export function removeSection(list: ListingSection[], id: string): ListingSection[] {
  const target = list.find((s) => s.id === id);
  if (!target) return list;
  if (target.type === 'custom') return list.filter((s) => s.id !== id);
  return list.map((s) => (s.id === id ? { ...s, enabled: false } : s));
}

/** Swaps an enabled section with its enabled neighbour. */
export function moveSection(list: ListingSection[], id: string, dir: -1 | 1): ListingSection[] {
  const enabledIdx = list.map((s, i) => (s.enabled ? i : -1)).filter((i) => i >= 0);
  const pos = enabledIdx.findIndex((i) => list[i].id === id);
  const swapPos = pos + dir;
  if (pos < 0 || swapPos < 0 || swapPos >= enabledIdx.length) return list;
  const next = [...list];
  const a = enabledIdx[pos];
  const b = enabledIdx[swapPos];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

export function updateCustomSection(list: ListingSection[], id: string, patch: Partial<Omit<CustomSection, 'id' | 'type'>>): ListingSection[] {
  return list.map((s) => (s.id === id && s.type === 'custom' ? { ...s, ...patch } : s));
}
