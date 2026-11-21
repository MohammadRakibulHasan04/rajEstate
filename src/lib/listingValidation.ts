/* ------------------------------------------------------------------
   LISTING VALIDATION
   Format checks always run; completeness requirements only apply when
   the listing is being published.
------------------------------------------------------------------- */
import { Listing } from '../types/listing';
import { isValidEmail, isValidPhone } from './contact';
import { isImageUrl, isSafeHttpUrl, videoEmbedUrl } from './media';
import { resolveSections } from './sections';

export type ValidationIntent = 'draft' | 'publish';

export interface ValidationIssue {
  message: string;
  /** Editor section id to jump to. */
  target: string;
}

const SLUG_RE = /^[a-z0-9-]{1,80}$/;

/**
 * @param form       the listing exactly as edited
 * @param effective  the listing with project inheritance applied (unit pages)
 */
export function validateListing(form: Listing, effective: Listing, intent: ValidationIntent): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (target: string, message: string) => issues.push({ target, message });

  /* Identity */
  if (!form.title.trim()) add('basics', 'Title is required.');
  else if (form.title.trim().length > 160) add('basics', 'Title must be 160 characters or fewer.');
  if (!SLUG_RE.test(form.slug)) add('basics', 'URL slug may only use lowercase letters, numbers and hyphens (max 80).');

  /* Numbers */
  if (form.price.amount < 0) add('specs', 'Price cannot be negative.');
  if (form.kind === 'project') {
    const codes = form.units.map((u) => u.code.trim().toLowerCase()).filter(Boolean);
    if (new Set(codes).size !== codes.length) add('specs', 'Unit codes must be unique.');
    if (form.units.some((u) => !u.code.trim())) add('specs', 'Every unit needs a code (e.g. 7A).');
  }

  /* Contact formats */
  const c = form.contact;
  if (c.phone.trim() && !isValidPhone(c.phone)) add('contact', 'Phone number looks invalid. Use 10–15 digits, e.g. +880 1712-345678.');
  if (c.whatsapp?.trim() && !isValidPhone(c.whatsapp)) add('contact', 'WhatsApp number looks invalid.');
  if (c.email?.trim() && !isValidEmail(c.email)) add('contact', 'Email address looks invalid.');

  /* Links */
  if (form.media.hero.url.trim() && !isImageUrl(form.media.hero.url)) add('media', 'Cover photo must be an https:// link or a /path on this site.');
  if (form.location.mapEmbedUrl?.trim() && !isSafeHttpUrl(form.location.mapEmbedUrl)) {
    add('section-location', 'Map embed must be a valid https:// link.');
  }
  if (form.media.videoUrl?.trim() && !videoEmbedUrl(form.media.videoUrl) && !isSafeHttpUrl(form.media.videoUrl)) {
    add('section-video', 'Video link must be a valid URL.');
  }

  /* Custom sections */
  for (const s of resolveSections(form)) {
    if (s.type !== 'custom' || !s.enabled) continue;
    if (!s.title.trim()) add(`section-${s.id}`, 'Every custom section needs a heading.');
    if (s.imageUrl?.trim() && !isImageUrl(s.imageUrl)) add(`section-${s.id}`, 'Custom section image must be a valid link.');
  }

  if (intent === 'publish') {
    if (!effective.summary.trim()) add('basics', 'A description is required before publishing.');
    if (!effective.location.area.trim()) add('location', 'Area is required before publishing.');
    if (!effective.media.hero.url.trim()) add('media', 'A cover photo is required before publishing.');
    if (!effective.contact.phone.trim()) add('contact', 'A contact phone number is required before publishing.');
    if (form.kind === 'project' && form.units.length === 0) add('specs', 'Add at least one unit before publishing a project.');
  }

  return issues;
}
