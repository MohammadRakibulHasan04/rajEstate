/* ------------------------------------------------------------------
   MEDIA HELPERS
   One place for building the photo list and sanitising embed links, so
   the gallery, lightbox and editor previews never disagree.
------------------------------------------------------------------- */
import { Listing, MediaImage } from '../types/listing';

/** True for absolute http(s) URLs. */
export function isSafeHttpUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Images may also be served from /public (e.g. "/listings/barakah/front.jpg"). */
export function isImageUrl(value?: string): boolean {
  const v = value?.trim();
  if (!v) return false;
  return (v.startsWith('/') && !v.startsWith('//')) || isSafeHttpUrl(v);
}

/** Accepts either a plain URL or a full `<iframe src="…">` snippet and returns the URL. */
export function extractEmbedSrc(input: string): string {
  const match = input.match(/src\s*=\s*["']([^"']+)["']/i);
  return (match ? match[1] : input).trim();
}

/** Splits pasted text into individual image URLs (one per line, comma or space separated). */
export function parseImageUrls(input: string): string[] {
  return Array.from(new Set(input.split(/[\s,]+/).map((s) => s.trim()).filter(isImageUrl)));
}

const YT_ID = /^[\w-]{6,20}$/;

/** Converts YouTube / Vimeo watch or share links into an embeddable player URL. */
export function videoEmbedUrl(url?: string): string | null {
  if (!url?.trim()) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m)\./, '');

  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0];
    return YT_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = u.searchParams.get('v');
    if (v && YT_ID.test(v)) return `https://www.youtube-nocookie.com/embed/${v}`;
    const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
    return m && YT_ID.test(m[1]) ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  }
  if (host === 'vimeo.com') {
    const m = u.pathname.match(/^\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  if (host === 'player.vimeo.com' && /^\/video\/\d+/.test(u.pathname)) return `https://player.vimeo.com${u.pathname}`;
  return null;
}

/**
 * Every unique photo of a listing in display order: cover first, then the
 * gallery. Images from legacy editorial chapters are appended so documents
 * saved before the editor change still show all their photos.
 */
export function listingPhotos(l: Listing): MediaImage[] {
  const list: MediaImage[] = [];
  const seen = new Set<string>();
  const push = (img: MediaImage | undefined) => {
    const url = img?.url?.trim();
    if (!img || !url || seen.has(url)) return;
    seen.add(url);
    list.push({ ...img, url });
  };

  if (l.media.hero?.url) push({ ...l.media.hero, room: l.media.hero.room || 'Exterior' });
  l.media.gallery.forEach(push);
  (l.chapters ?? []).forEach((ch) => {
    if (ch?.imageUrl) push({ url: ch.imageUrl, room: ch.kicker?.replace(/^The\s+/i, '') || undefined, caption: ch.titleEn });
  });
  return list;
}
