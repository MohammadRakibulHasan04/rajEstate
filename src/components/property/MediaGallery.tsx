import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Expand } from 'lucide-react';
import { MediaImage } from '../../types/listing';

/* ── Lightbox ──────────────────────────────────────────────────── */

export const Lightbox: React.FC<{ images: MediaImage[]; index: number; onClose: () => void; onIndex: (i: number) => void }> = ({
  images,
  index,
  onClose,
  onIndex,
}) => {
  const prev = useCallback(() => onIndex((index - 1 + images.length) % images.length), [index, images.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % images.length), [index, images.length, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, prev, next]);

  const img = images[index];
  if (!img) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-[#05080f]/97 backdrop-blur-xl flex flex-col" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div className="flex items-center justify-between px-6 md:px-10 py-5 text-[10.5px] font-mono tracking-[0.24em] uppercase">
        <span className="text-[#d1ad7a]">
          {String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
          {img.room && <span className="text-slate-500"> · {img.room}</span>}
        </span>
        <button id="lightbox-close" onClick={onClose} className="p-2 text-slate-300 hover:text-white cursor-pointer" aria-label="Close">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center px-4 md:px-20 min-h-0">
        <img key={img.url} src={img.url} alt={img.caption || ''} className="toast max-h-full max-w-full object-contain rounded-lg" />
        {images.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous photo" className="absolute left-3 md:left-8 p-3 rounded-full border border-white/15 bg-black/40 text-white hover:border-[#d1ad7a] cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} aria-label="Next photo" className="absolute right-3 md:right-8 p-3 rounded-full border border-white/15 bg-black/40 text-white hover:border-[#d1ad7a] cursor-pointer">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <div className="px-6 md:px-10 py-5 flex items-center justify-between gap-6">
        <p className="text-sm text-slate-300 truncate">
          {img.captionBn && <span className="font-display text-lg text-[#f4efe6] mr-3">{img.captionBn}</span>}
          {img.caption}
        </p>
        <div className="hidden md:flex gap-2 overflow-x-auto max-w-[50%]">
          {images.map((m, i) => (
            <button
              key={m.url + i}
              onClick={() => onIndex(i)}
              className={`shrink-0 w-14 h-10 rounded-md overflow-hidden border cursor-pointer transition-all ${i === index ? 'border-[#d1ad7a]' : 'border-transparent opacity-50 hover:opacity-100'}`}
              aria-label={`Photo ${i + 1}`}
            >
              <img src={m.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Gallery ───────────────────────────────────────────────────── */

interface GalleryProps {
  hero: MediaImage;
  images: MediaImage[];
  openAt: number | null;
  setOpenAt: (i: number | null) => void;
}

const INITIAL = 9;

export const MediaGallery: React.FC<GalleryProps> = ({ hero, images, openAt, setOpenAt }) => {
  const all = useMemo(() => (hero.url ? [{ ...hero, room: hero.room || 'Exterior' }, ...images] : images), [hero, images]);
  const rooms = useMemo(() => Array.from(new Set(all.map((i) => i.room).filter(Boolean))) as string[], [all]);
  const [room, setRoom] = useState<string>('all');
  const [expanded, setExpanded] = useState(false);

  const filtered = room === 'all' ? all : all.filter((i) => i.room === room);
  const visible = expanded ? filtered : filtered.slice(0, INITIAL);

  if (all.length < 2) return null;

  return (
    <section id="gallery" className="relative py-28 md:py-36">
      <div className="hairline max-w-7xl mx-auto mb-24" />
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12" data-reveal>
          <div>
            <div className="eyebrow mb-7">The Rooms</div>
            <h2 className="font-display font-light text-5xl sm:text-6xl lg:text-[5rem] leading-[0.95] tracking-[-0.02em]">
              প্রতিটি ঘরে, <em className="italic text-gradient-gold">একটি গল্প।</em>
            </h2>
          </div>
          {rooms.length > 1 && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter photos by room">
              {['all', ...rooms].map((r) => (
                <button
                  key={r}
                  id={`gallery-filter-${r.toLowerCase()}`}
                  role="tab"
                  aria-selected={room === r}
                  data-active={room === r}
                  onClick={() => setRoom(r)}
                  className="chip"
                >
                  {r === 'all' ? `All · ${all.length}` : r}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="masonry">
          {visible.map((img) => {
            const idx = all.indexOf(img);
            return (
              <figure key={img.url + idx} className="group cursor-zoom-in" onClick={() => setOpenAt(idx)}>
                <div className="relative overflow-hidden rounded-xl bg-[#0c1220]">
                  <img
                    src={img.url}
                    alt={img.caption || img.room || 'Property photo'}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Expand className="absolute top-4 right-4 w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                {(img.caption || img.captionBn) && (
                  <figcaption className="mt-3 flex items-baseline justify-between gap-3 text-[10px] font-mono tracking-[0.24em] uppercase">
                    <span className="text-slate-300 normal-case tracking-normal font-sans text-sm">{img.captionBn || img.caption}</span>
                    <span className="text-[#d1ad7a] shrink-0">{img.room}</span>
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>

        {filtered.length > INITIAL && (
          <div className="mt-10 flex justify-center">
            <button id="gallery-toggle" onClick={() => setExpanded((v) => !v)} className="btn-ghost">
              {expanded ? 'Show fewer' : `Show all ${filtered.length} photos`}
            </button>
          </div>
        )}
      </div>

      {openAt !== null && <Lightbox images={all} index={openAt} onIndex={setOpenAt} onClose={() => setOpenAt(null)} />}
    </section>
  );
};
