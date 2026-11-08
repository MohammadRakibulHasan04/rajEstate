import { useEffect, useRef, useState } from 'react';

/**
 * All hero video frames, resolved by Vite at build time and sorted
 * numerically (frame_001.png ... frame_006.png).
 */
const frameModules = import.meta.glob(
  ['../assets/frames/*.png', '../assets/frames/*.jpg', '../assets/frames/*.jpeg', '../assets/frames/*.webp'],
  {
    eager: true,
    query: '?url',
    import: 'default',
  }
) as Record<string, string>;

export const FRAME_URLS: string[] = Object.keys(frameModules)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((key) => frameModules[key]);

export const FRAME_COUNT = FRAME_URLS.length || 1;

/** Convenience accessor using 1-based frame numbers (as in the filenames). */
export const frameUrl = (frameNumber: number) => {
  if (FRAME_URLS.length === 0) return '';
  const idx = Math.min(FRAME_URLS.length, Math.max(1, frameNumber)) - 1;
  return FRAME_URLS[idx] || '';
};

/**
 * Module-level cache so decoded hero frames and preloader completion
 * persist across route changes without re-fetching or re-running the intro.
 */
let cachedImages: HTMLImageElement[] | null = null;
let cachedProgress = 0;
let cachedLoaded = false;
let decodePromise: Promise<void> | null = null;
const progressListeners = new Set<(p: number, done: boolean) => void>();

const INTRO_SESSION_KEY = 'aura_intro_played_v1';
let introPlayedMemory = (() => {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(INTRO_SESSION_KEY) === '1';
  } catch {
    return false;
  }
})();

export function hasIntroPlayed(): boolean {
  return introPlayedMemory;
}

export function markIntroPlayed(): void {
  introPlayedMemory = true;
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, '1');
  } catch {
    // ignore storage restrictions
  }
}

function ensureFramesDecoded() {
  if (cachedImages && cachedLoaded) return;
  if (decodePromise) return;

  if (FRAME_URLS.length === 0) {
    cachedImages = [];
    cachedProgress = 1;
    cachedLoaded = true;
    return;
  }

  let done = 0;
  const total = FRAME_URLS.length;

  const images = FRAME_URLS.map((src) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    return img;
  });
  cachedImages = images;

  const notify = () => {
    progressListeners.forEach((cb) => cb(cachedProgress, cachedLoaded));
  };

  const settle = () => {
    done += 1;
    cachedProgress = done / total;
    if (done >= total) {
      cachedLoaded = true;
    }
    notify();
  };

  decodePromise = Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth) {
        settle();
        return Promise.resolve();
      }
      const p = img.decode
        ? img.decode()
        : new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = () => rej();
          });
      return p.then(settle, settle);
    })
  ).then(() => undefined);
}

/**
 * Preloads and decodes every frame once per session so the scroll-driven
 * sequence never stutters and returning from a detail page is instant.
 */
export function useFramePreloader() {
  ensureFramesDecoded();
  const imagesRef = useRef<HTMLImageElement[]>(cachedImages || []);
  const [progress, setProgress] = useState(cachedProgress);
  const [loaded, setLoaded] = useState(cachedLoaded);

  useEffect(() => {
    ensureFramesDecoded();
    if (cachedImages) imagesRef.current = cachedImages;
    if (cachedLoaded) {
      setProgress(1);
      setLoaded(true);
      return;
    }

    const listener = (p: number, done: boolean) => {
      setProgress(p);
      if (done) setLoaded(true);
    };
    progressListeners.add(listener);
    return () => {
      progressListeners.delete(listener);
    };
  }, []);

  return { images: imagesRef, progress, loaded };
}
