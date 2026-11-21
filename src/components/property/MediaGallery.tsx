import React, { useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MediaImage } from '../../types/listing';

/** Full-screen photo viewer with keyboard navigation and focus management. */
export const Lightbox: React.FC<{ images: MediaImage[]; index: number; onClose: () => void; onIndex: (i: number) => void }> = ({
  images,
  index,
  onClose,
  onIndex,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const prev = useCallback(() => onIndex((index - 1 + images.length) % images.length), [index, images.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % images.length), [index, images.length, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previousFocus?.focus?.();
    };
  }, []);

  const img = images[index];
  if (!img) return null;
  const label = img.caption || img.room;

  return (
    <div className="fixed inset-0 z-[120] bg-[#ffffff]/97 backdrop-blur-xl flex flex-col" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div className="flex items-center justify-between px-6 md:px-10 py-5 text-[10.5px] font-mono tracking-[0.24em] uppercase border-b border-[#181512]/[0.08]">
        <span className="text-[#855B30] font-medium">
          {index + 1} / {images.length}
          {img.room && <span className="text-[#6E6559] font-normal"> · {img.room}</span>}
        </span>
        <button ref={closeRef} id="lightbox-close" onClick={onClose} className="p-2 text-[#4A433B] hover:text-[#181512] cursor-pointer" aria-label="Close">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center px-4 md:px-20 min-h-0 overflow-hidden py-4">
        <img key={img.url} src={img.url} alt={label || 'Property photo'} className="toast max-h-full max-w-full object-contain rounded-xl shadow-[0_24px_60px_-18px_rgba(24,21,18,0.22)] border border-[#181512]/10 bg-[#ffffff]" />
        {images.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous photo" className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full border border-[#181512]/15 bg-[#ffffff]/92 text-[#181512] hover:border-[#9A6B3B] shadow-md cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} aria-label="Next photo" className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full border border-[#181512]/15 bg-[#ffffff]/92 text-[#181512] hover:border-[#9A6B3B] shadow-md cursor-pointer">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <div className="px-6 md:px-10 py-5 flex items-center justify-between gap-6 border-t border-[#181512]/[0.08]">
        <p className="text-sm text-[#4A433B] truncate">{img.caption}</p>
        <div className="hidden md:flex gap-2 overflow-x-auto max-w-[60%]">
          {images.map((m, i) => (
            <button
              key={m.url + i}
              onClick={() => onIndex(i)}
              className={`shrink-0 w-14 h-10 rounded-md overflow-hidden border cursor-pointer transition-all ${i === index ? 'border-[#9A6B3B] ring-2 ring-[#9A6B3B]/25' : 'border-transparent opacity-50 hover:opacity-100'}`}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === index}
            >
              <img src={m.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
