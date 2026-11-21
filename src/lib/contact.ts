/* ------------------------------------------------------------------
   CONTACT HELPERS (Bangladesh-aware)
------------------------------------------------------------------- */
import { ListingContact } from '../types/listing';

const digits = (v: string) => v.replace(/\D/g, '');

/** 10–15 digits, optionally starting with "+", allowing spaces, dashes and brackets. */
export function isValidPhone(value: string): boolean {
  const v = value.trim();
  if (!/^\+?[\d\s()-]+$/.test(v)) return false;
  const n = digits(v).length;
  return n >= 10 && n <= 15;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/** wa.me needs the international number; local BD numbers (01XXXXXXXXX) get the 88 prefix. */
export function waHref(phone: string, text?: string): string {
  let d = digits(phone);
  if (d.length === 11 && d.startsWith('01')) d = `88${d}`;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export const mailHref = (email: string, subject?: string) =>
  `mailto:${email.trim()}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

/** Trims every field and drops empty optional ones so documents stay tidy. */
export function normalizeContact(raw: Partial<ListingContact> | undefined | null): ListingContact {
  const c = raw ?? {};
  const opt = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  const out: ListingContact = { phone: typeof c.phone === 'string' ? c.phone.trim() : '' };
  (['name', 'designation', 'company', 'whatsapp', 'email', 'hours', 'address'] as const).forEach((k) => {
    const v = opt(c[k]);
    if (v) out[k] = v;
  });
  return out;
}

export function hasAnyContact(c: ListingContact): boolean {
  return !!(c.phone?.trim() || c.whatsapp?.trim() || c.email?.trim());
}
