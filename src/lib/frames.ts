import { useEffect, useRef, useState } from 'react';

/**
 * All hero video frames, resolved by Vite at build time and sorted
 * numerically (frame_001.jpg ... frame_037.jpg).
 */
const frameModules = import.meta.glob('../assets/frames/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const FRAME_URLS: string[] = Object.keys(frameModules)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((key) => frameModules[key]);

export const FRAME_COUNT = FRAME_URLS.length;

/** Convenience accessor using 1-based frame numbers (as in the filenames). */
export const frameUrl = (frameNumber: number) =>
  FRAME_URLS[Math.min(FRAME_COUNT, Math.max(1, frameNumber)) - 1];

/**
 * Preloads and decodes every frame so the scroll-driven sequence never
 * stutters. Returns the decoded images, a 0..1 progress value and a
 * `loaded` flag.
 */
export function useFramePreloader() {
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let done = 0;

    const images = FRAME_URLS.map((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      return img;
    });
    imagesRef.current = images;

    const settle = () => {
      if (cancelled) return;
      done += 1;
      setProgress(done / FRAME_COUNT);
      if (done === FRAME_COUNT) setLoaded(true);
    };

    images.forEach((img) => {
      // decode() resolves once the bitmap is ready to paint; fall back to load events.
      const p = img.decode ? img.decode() : new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      p.then(settle, settle);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { images: imagesRef, progress, loaded };
}
