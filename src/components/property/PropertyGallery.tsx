import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, Layers, Play } from 'lucide-react';
import { MediaImage } from '../../types/listing';

interface Props {
  photos: MediaImage[];
  title: string;
  onOpen: (index: number) => void;
  /** Shown when the page has a floor-plan or video section to jump to. */
  onFloorPlans?: () => void;
  onVideo?: () => void;
  /** Duration in milliseconds between photo transitions. Defaults to 5000ms. */
  autoPlayInterval?: number;
  /** Set to true to pause auto-advancing (e.g. while a lightbox is open). */
  paused?: boolean;
}

const pill =
  'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF7F2]/92 hover:bg-[#FFFFFF] backdrop-blur-md border border-[#181512]/15 hover:border-[#9A6B3B] text-xs sm:text-[13px] font-medium text-[#181512] transition-colors cursor-pointer shadow-md';
const arrow =
  'absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FAF7F2]/88 hover:bg-[#FFFFFF] backdrop-blur-md border border-[#181512]/15 hover:border-[#9A6B3B] text-[#181512] flex items-center justify-center transition-colors cursor-pointer shadow-lg';

/** Primary photo stage with two thumbnails. Every image opens the lightbox. */
export const PropertyGallery: React.FC<Props> = ({
  photos,
  title,
  onOpen,
  onFloorPlans,
  onVideo,
  autoPlayInterval = 5000,
  paused = false,
}) => {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const total = photos.length;

  useEffect(() => {
    setActive(0);
    setPrev(null);
  }, [photos[0]?.url]);

  // Pause when the browser tab is hidden to avoid background thrashing
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Preload the next incoming photo so transition is instantaneous
  useEffect(() => {
    if (total <= 1) return;
    const nextIdx = (active + 1) % total;
    const nextPhoto = photos[nextIdx];
    if (nextPhoto?.url) {
      const img = new Image();
      img.src = nextPhoto.url;
    }
  }, [active, total, photos]);

  // Auto-advance the main thumbnail photo after duration
  useEffect(() => {
    if (total <= 1 || isHovered || isTabHidden || paused) return;

    const timer = setInterval(() => {
      setActive((curr) => {
        setPrev(curr % total);
        return (curr + 1) % total;
      });
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [total, isHovered, isTabHidden, paused, autoPlayInterval, active]);

  const step = useCallback(
    (e: React.MouseEvent, dir: -1 | 1) => {
      e.stopPropagation();
      setActive((curr) => {
        setPrev(curr % total);
        return (curr + dir + total) % total;
      });
    },
    [total]
  );

  if (!total) {
    return (
      <div className="rounded-2xl border border-dashed border-[#181512]/15 bg-[#F6F2EA] h-[220px] flex items-center justify-center text-sm text-[#786F63]">
        Photos coming soon
      </div>
    );
  }

  const current = photos[active % total];
  const prevPhoto = prev !== null && prev !== (active % total) ? photos[prev % total] : null;
  const thumbs = photos.slice(1, 3);

  return (
    <div className="rounded-2xl overflow-hidden border border-[#181512]/12 bg-[#EAE3D7] shadow-[0_24px_65px_-20px_rgba(24,21,18,0.16)]">
      <div className={`grid grid-cols-1 ${thumbs.length ? 'md:grid-cols-12' : ''} gap-1.5 md:gap-2 md:h-[400px] lg:h-[460px]`}>
        <div
          onClick={() => onOpen(active % total)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          tabIndex={0}
          role="region"
          aria-label={`Photo showcase for ${title}. Slide ${(active % total) + 1} of ${total}`}
          className={`${thumbs.length ? 'md:col-span-9' : ''} relative h-[260px] sm:h-[340px] md:h-full overflow-hidden bg-[#E5DEC9] group cursor-zoom-in select-none focus:outline-none`}
        >
          {/* Underneath: previous photo to ensure seamless cross-fade with no background flash */}
          {prevPhoto && (
            <img
              key={`prev-${prevPhoto.url}`}
              src={prevPhoto.url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          )}

          {/* Active photo */}
          <img
            key={`curr-${current.url}`}
            src={current.url}
            alt={current.caption || current.room || title}
            fetchPriority="high"
            className={`${
              prevPhoto ? 'gallery-fade-in' : ''
            } absolute inset-0 w-full h-full object-cover z-10 transition-transform duration-700 ease-out group-hover:scale-[1.015]`}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 z-10" />

          {(current.room || current.caption) && (
            <div
              key={`badge-${current.caption || current.room}`}
              className="pointer-events-none absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-[#FAF7F2]/90 backdrop-blur-md border border-[#181512]/10 text-[11px] font-mono tracking-[0.2em] uppercase text-[#181512] z-20 transition-opacity duration-300"
            >
              {current.caption || current.room}
            </div>
          )}

          {total > 1 && (
            <>
              <button type="button" id="gallery-prev" onClick={(e) => step(e, -1)} aria-label="Previous photo" className={`${arrow} left-3.5 sm:left-5`}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button type="button" id="gallery-next" onClick={(e) => step(e, 1)} aria-label="Next photo" className={`${arrow} right-3.5 sm:right-5`}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 z-20 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button type="button" id="gallery-all" onClick={() => onOpen(active % total)} className={pill}>
              <Images className="w-4 h-4 text-[#9A6B3B]" /> All Photos
            </button>
            {onFloorPlans && (
              <button type="button" id="gallery-floorplans" onClick={onFloorPlans} className={pill}>
                <Layers className="w-4 h-4 text-[#9A6B3B]" /> Floor Plans
              </button>
            )}
            {onVideo && (
              <button type="button" id="gallery-video" onClick={onVideo} className={pill}>
                <Play className="w-4 h-4 text-[#9A6B3B]" /> Video Tour
              </button>
            )}
          </div>

          <div className="pointer-events-none absolute bottom-4 right-4 sm:bottom-5 sm:right-5 px-3.5 py-1.5 rounded-full bg-[#FAF7F2]/92 border border-[#181512]/15 text-xs font-mono text-[#181512] shadow-md z-20">
            {(active % total) + 1}/{total}
          </div>
        </div>

        {thumbs.length > 0 && (
          <div className={`md:col-span-3 grid ${thumbs.length === 2 ? 'grid-cols-2 md:grid-cols-1 md:grid-rows-2' : 'grid-cols-1'} gap-1.5 md:gap-2 h-28 md:h-full`}>
            {thumbs.map((p, i) => {
              const index = i + 1;
              const remaining = total - 3;
              const isLast = i === thumbs.length - 1 && remaining > 0;
              return (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => onOpen(index)}
                  className="relative w-full h-full overflow-hidden bg-[#E5DEC9] group cursor-zoom-in"
                  aria-label={`Open ${p.caption || p.room || `photo ${index + 1}`}`}
                >
                  <img src={p.url} alt={p.caption || p.room || `Photo ${index + 1}`} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {isLast ? (
                    <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-white font-display text-2xl">+{remaining}</span>
                  ) : (
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  )}
                  {!isLast && (p.room || p.caption) && (
                    <span className="pointer-events-none absolute bottom-2.5 left-3 text-xs font-medium text-white drop-shadow">{p.room || p.caption}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
