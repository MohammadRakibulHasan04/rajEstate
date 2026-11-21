/* ------------------------------------------------------------------
   LISTING COMPLETENESS
   A checklist that tells editors what is still missing. Optional
   sections only count when they are switched on.
------------------------------------------------------------------- */
import { Listing } from '../types/listing';
import { effectivePrice } from './significance';
import { isSectionEnabled } from './sections';

export interface ScoreTip {
  label: string;
  done: boolean;
  weight: number;
  /** Editor section id to jump to. */
  target: string;
}

export function scoreListing(l: Listing): { score: number; tips: ScoreTip[] } {
  const price = effectivePrice(l);
  const isLand = l.category === 'land';
  const specsDone =
    l.kind === 'project'
      ? l.units.length > 0
      : isLand
        ? !!(l.core.landKatha || l.core.sizeSqft)
        : !!(l.core.sizeSqft && l.core.beds && l.core.baths);

  const hasTitle = l.titleMode === 'price' ? price.amount > 0 || !!l.title.trim() : !!l.title.trim();

  const tips: ScoreTip[] = [
    { label: 'Title and description (120+ characters)', done: hasTitle && l.summary.trim().length >= 120, weight: 14, target: 'basics' },
    { label: 'Area and full address', done: !!l.location.area.trim() && !!l.location.address.trim(), weight: 10, target: 'location' },
    {
      label: l.kind === 'project' ? 'Unit inventory added' : isLand ? 'Land size' : 'Size, bedrooms and bathrooms',
      done: specsDone,
      weight: 12,
      target: 'specs',
    },
    { label: 'Price set', done: price.amount > 0, weight: 8, target: 'specs' },
    { label: 'Cover photo', done: !!l.media.hero.url.trim(), weight: 12, target: 'media' },
    { label: 'At least 5 gallery photos', done: l.media.gallery.length >= 5, weight: 10, target: 'media' },
    { label: 'Contact person and phone', done: !!l.contact.name?.trim() && !!l.contact.phone.trim(), weight: 14, target: 'contact' },
  ];

  if (isSectionEnabled(l, 'floorPlans')) {
    tips.push({
      label: 'Floor plan uploaded',
      done: l.media.floorPlans.length > 0 || l.units.some((u) => !!u.floorPlanUrl),
      weight: 7,
      target: 'section-floorPlans',
    });
  }
  if (isSectionEnabled(l, 'amenities')) {
    tips.push({ label: '3+ amenities', done: l.amenities.filter((a) => a.label.trim()).length >= 3, weight: 7, target: 'section-amenities' });
  }
  if (isSectionEnabled(l, 'location')) {
    tips.push({ label: '3+ nearby places', done: l.nearby.length >= 3, weight: 6, target: 'section-location' });
  }
  if (isSectionEnabled(l, 'legal')) {
    tips.push({
      label: 'Developer and RAJUK approval',
      done: !!l.trust.developer.trim() && !!l.trust.rajukApproval?.trim(),
      weight: 6,
      target: 'section-legal',
    });
  }

  const total = tips.reduce((s, t) => s + t.weight, 0);
  const earned = tips.reduce((s, t) => s + (t.done ? t.weight : 0), 0);
  return { score: total ? Math.round((earned / total) * 100) : 0, tips };
}
