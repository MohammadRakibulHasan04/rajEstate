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
const DIRECT_VIDEO_RE = /\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i;

export interface VideoEmbedMeta {
  provider: 'youtube' | 'vimeo' | 'direct' | 'gdrive' | 'facebook' | 'iframe';
  providerLabel: string;
  embedUrl: string;
  autoplayUrl: string;
  sourceUrl: string;
  thumbnailUrl?: string;
  fallbackThumbnailUrl?: string;
  videoId?: string;
}

/**
 * Parses YouTube, Vimeo, Google Drive, Facebook, direct video files (.mp4/.webm),
 * or raw `<iframe src="…">` snippets into a structured professional embed descriptor.
 */
export function parseVideoEmbed(rawInput?: string): VideoEmbedMeta | null {
  if (!rawInput?.trim()) return null;
  const extracted = extractEmbedSrc(rawInput);
  if (!extracted) return null;

  // Relative direct video path (e.g. "/videos/overview.mp4")
  if (extracted.startsWith('/') && !extracted.startsWith('//') && DIRECT_VIDEO_RE.test(extracted)) {
    return {
      provider: 'direct',
      providerLabel: 'Direct HD Video',
      embedUrl: extracted,
      autoplayUrl: extracted,
      sourceUrl: extracted,
    };
  }

  let u: URL;
  try {
    u = new URL(extracted);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;

  const host = u.hostname.replace(/^(www|m)\./, '').toLowerCase();

  // 1. Direct video file on HTTPS/HTTP
  if (DIRECT_VIDEO_RE.test(u.pathname)) {
    return {
      provider: 'direct',
      providerLabel: 'Direct HD Video',
      embedUrl: u.toString(),
      autoplayUrl: u.toString(),
      sourceUrl: u.toString(),
    };
  }

  // 2. YouTube (watch, youtu.be, shorts, live, embed)
  if (host === 'youtu.be' || host === 'youtube.com' || host === 'youtube-nocookie.com') {
    let id = '';
    if (host === 'youtu.be') {
      id = u.pathname.slice(1).split('/')[0];
    } else {
      id = u.searchParams.get('v') || '';
      if (!id) {
        const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]+)/);
        if (m) id = m[1];
      }
    }
    if (YT_ID.test(id)) {
      const startParam = u.searchParams.get('t') || u.searchParams.get('start');
      const startSec = startParam ? parseInt(startParam.replace(/\D/g, ''), 10) : 0;
      const startQuery = startSec > 0 ? `&start=${startSec}` : '';
      const base = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1${startQuery}`;
      return {
        provider: 'youtube',
        providerLabel: 'YouTube Presentation',
        videoId: id,
        embedUrl: base,
        autoplayUrl: `${base}&autoplay=1`,
        sourceUrl: `https://www.youtube.com/watch?v=${id}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
        fallbackThumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
    }
  }

  // 3. Vimeo (vimeo.com/123456, vimeo.com/123456/hash, player.vimeo.com/video/123456)
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m =
      u.pathname.match(/^\/video\/(\d+)/) ||
      u.pathname.match(/^\/(?:channels\/[\w-]+\/|groups\/[\w-]+\/videos\/|manage\/videos\/)?(\d+)(?:\/([\w-]+))?/);
    if (m) {
      const id = m[1];
      const hash = m[2] || u.searchParams.get('h') || '';
      const hashQuery = hash ? `&h=${encodeURIComponent(hash)}` : '';
      const base = `https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0${hashQuery}`;
      return {
        provider: 'vimeo',
        providerLabel: 'Vimeo Presentation',
        videoId: id,
        embedUrl: base,
        autoplayUrl: `${base}&autoplay=1`,
        sourceUrl: `https://vimeo.com/${id}`,
      };
    }
  }

  // 4. Google Drive shared video
  if (host === 'drive.google.com') {
    const m = u.pathname.match(/\/file\/d\/([\w-]+)/);
    if (m) {
      const id = m[1];
      const preview = `https://drive.google.com/file/d/${id}/preview`;
      return {
        provider: 'gdrive',
        providerLabel: 'Google Drive Video',
        videoId: id,
        embedUrl: preview,
        autoplayUrl: preview,
        sourceUrl: `https://drive.google.com/file/d/${id}/view`,
      };
    }
  }

  // 5. Facebook video
  if (host === 'facebook.com' || host === 'fb.watch') {
    if (u.pathname.includes('/plugins/video.php')) {
      return {
        provider: 'facebook',
        providerLabel: 'Facebook Video',
        embedUrl: u.toString(),
        autoplayUrl: u.toString(),
        sourceUrl: u.toString(),
      };
    }
    if (host === 'fb.watch' || /\/videos\/|\/watch\/|\/reel\//.test(u.pathname)) {
      const pluginUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u.toString())}&show_text=0`;
      return {
        provider: 'facebook',
        providerLabel: 'Facebook Video',
        embedUrl: pluginUrl,
        autoplayUrl: `${pluginUrl}&autoplay=1`,
        sourceUrl: u.toString(),
      };
    }
  }

  // 6. Generic iframe / embed URLs (e.g. Matterport, Wistia, Loom, Cloudflare Stream)
  if (/<iframe/i.test(rawInput) || /\/embed\/|\/player\/|player\.|watch\./i.test(u.toString())) {
    const sep = u.search ? '&' : '?';
    return {
      provider: 'iframe',
      providerLabel: 'Embedded Presentation',
      embedUrl: u.toString(),
      autoplayUrl: `${u.toString()}${sep}autoplay=1`,
      sourceUrl: u.toString(),
    };
  }

  return null;
}

/** Converts supported video links or iframe snippets into an embeddable player URL. */
export function videoEmbedUrl(url?: string): string | null {
  return parseVideoEmbed(url)?.embedUrl ?? null;
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
