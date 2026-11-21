import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Image as ImageIcon, Plus, Star, Trash2 } from 'lucide-react';
import { MediaImage } from '../../types/listing';
import { isImageUrl, parseImageUrls, videoEmbedUrl } from '../../lib/media';
import { Field, TextInput } from './fields';

const ROOM_OPTIONS = ['Exterior', 'Living', 'Dining', 'Bedroom', 'Kitchen', 'Bath', 'Balcony', 'Terrace', 'Aerial', 'Amenities', 'Detail'];

const iconBtn = 'p-1.5 rounded-md bg-white/95 text-[#3D362E] hover:text-[#181512] disabled:opacity-30 cursor-pointer shadow-xs';

const Thumb: React.FC<{ url: string; alt: string; contain?: boolean }> = ({ url, alt, contain }) => {
  const [failed, setFailed] = useState(false);
  if (!isImageUrl(url) || failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#9A3B3B] bg-[#F6F2EA] text-[11px] font-mono gap-1">
        <ImageIcon className="w-5 h-5 opacity-60" /> Invalid image
      </div>
    );
  }
  return <img src={url} alt={alt} onError={() => setFailed(true)} className={`absolute inset-0 w-full h-full ${contain ? 'object-contain p-2' : 'object-cover'}`} />;
};

/** Paste one or more URLs (newline, comma or space separated). */
const BulkUrlInput: React.FC<{ onAdd: (urls: string[]) => void; placeholder: string; buttonLabel: string; id: string }> = ({ onAdd, placeholder, buttonLabel, id }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const submit = () => {
    const urls = parseImageUrls(value);
    if (!urls.length) {
      setError('Enter at least one valid https:// image link or /path.');
      return;
    }
    onAdd(urls);
    setValue('');
    setError('');
  };
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        <textarea
          id={id}
          rows={2}
          className="lux-textarea flex-1 !min-h-0"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          aria-invalid={!!error}
        />
        <button type="button" onClick={submit} disabled={!value.trim()} className="btn-gold !py-2.5 !px-5 justify-center sm:self-start">
          <Plus className="w-4 h-4" /> {buttonLabel}
        </button>
      </div>
      {error ? <p className="mt-1.5 text-[12px] text-red-600">{error}</p> : <p className="mt-1.5 text-[12px] text-[#6E6559]">Paste several links at once, one per line.</p>}
    </div>
  );
};

function move<T>(list: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/* ── Cover + gallery ───────────────────────────────────────────── */

interface PhotosProps {
  hero: MediaImage;
  gallery: MediaImage[];
  onChange: (next: { hero: MediaImage; gallery: MediaImage[] }) => void;
  /** Shown when the cover is inherited from a parent project. */
  inheritedHeroUrl?: string;
}

export const PhotosEditor: React.FC<PhotosProps> = ({ hero, gallery, onChange, inheritedHeroUrl }) => {
  const existing = new Set([hero.url, ...gallery.map((g) => g.url)].filter(Boolean));
  const setGallery = (g: MediaImage[]) => onChange({ hero, gallery: g });

  const add = (urls: string[]) => {
    const fresh = urls.filter((u) => !existing.has(u));
    if (!fresh.length) return;
    if (!hero.url) {
      const [first, ...rest] = fresh;
      onChange({ hero: { url: first, room: 'Exterior' }, gallery: [...gallery, ...rest.map((url) => ({ url }))] });
    } else {
      setGallery([...gallery, ...fresh.map((url) => ({ url }))]);
    }
  };

  const makeCover = (i: number) => {
    const picked = gallery[i];
    const rest = gallery.filter((_, j) => j !== i);
    onChange({ hero: picked, gallery: hero.url ? [hero, ...rest] : rest });
  };

  return (
    <div className="space-y-6">
      <BulkUrlInput id="photos-add" onAdd={add} buttonLabel="Add Photos" placeholder="https://…/front.jpg" />

      <div>
        <div className="mono-label mb-3">Cover Photo</div>
        {hero.url ? (
          <div className="grid sm:grid-cols-[minmax(0,320px)_1fr] gap-4 items-start">
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-[#181512]/12 bg-[#EAE3D7]">
              <Thumb url={hero.url} alt="Cover" />
            </div>
            <div className="space-y-3">
              <TextInput value={hero.url} onChange={(url) => onChange({ hero: { ...hero, url }, gallery })} aria-label="Cover photo URL" className="!text-xs" />
              <TextInput value={hero.caption} placeholder="Caption (e.g. Front elevation)" onChange={(caption) => onChange({ hero: { ...hero, caption }, gallery })} aria-label="Cover caption" className="!text-xs" />
              <button type="button" onClick={() => onChange({ hero: { url: '' }, gallery })} className="btn-quiet !py-2 !text-[10.5px]">
                <Trash2 className="w-3.5 h-3.5" /> Remove Cover
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#181512]/15 bg-[#F6F2EA]/50 p-6 text-sm text-[#786F63]">
            {inheritedHeroUrl ? 'No cover set. The project cover photo will be used.' : 'No cover photo yet. The first photo you add becomes the cover.'}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="mono-label">Gallery</span>
          <span className="text-[11px] font-mono text-[#786F63]">{gallery.length} photos</span>
        </div>
        {gallery.length === 0 ? (
          <p className="text-sm text-[#6E6559] italic">No gallery photos yet.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((item, i) => (
              <li key={item.url + i} className="rounded-xl border border-[#181512]/10 bg-[#FCFBF8] overflow-hidden">
                <div className="relative aspect-[4/3] bg-[#EAE3D7]">
                  <Thumb url={item.url} alt={item.caption || `Photo ${i + 1}`} />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button type="button" className={iconBtn} onClick={() => makeCover(i)} title="Set as cover" aria-label={`Set photo ${i + 1} as cover`}>
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className={iconBtn} disabled={i === 0} onClick={() => setGallery(move(gallery, i, -1))} aria-label={`Move photo ${i + 1} earlier`}>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className={iconBtn} disabled={i === gallery.length - 1} onClick={() => setGallery(move(gallery, i, 1))} aria-label={`Move photo ${i + 1} later`}>
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className={`${iconBtn} !text-red-600`} onClick={() => setGallery(gallery.filter((_, j) => j !== i))} aria-label={`Delete photo ${i + 1}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-3 grid grid-cols-[110px_1fr] gap-2">
                  <select
                    className="lux-select !py-1.5 !text-xs"
                    value={item.room || ''}
                    onChange={(e) => setGallery(gallery.map((g, j) => (j === i ? { ...g, room: e.target.value || undefined } : g)))}
                    aria-label="Room"
                  >
                    <option value="">Room…</option>
                    {ROOM_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <TextInput
                    className="!py-1.5 !text-xs"
                    placeholder="Caption"
                    value={item.caption}
                    onChange={(caption) => setGallery(gallery.map((g, j) => (j === i ? { ...g, caption } : g)))}
                    aria-label="Caption"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

/* ── Floor plans ───────────────────────────────────────────────── */

export const FloorPlansEditor: React.FC<{ plans: MediaImage[]; onChange: (p: MediaImage[]) => void; hint?: string }> = ({ plans, onChange, hint }) => (
  <div className="space-y-5">
    <BulkUrlInput
      id="plans-add"
      onAdd={(urls) => onChange([...plans, ...urls.filter((u) => !plans.some((p) => p.url === u)).map((url) => ({ url, caption: '' }))])}
      buttonLabel="Add Plans"
      placeholder="https://…/floor-plan.jpg"
    />
    {hint && <p className="text-[12px] text-[#6E6559]">{hint}</p>}
    {plans.length > 0 && (
      <ul className="grid sm:grid-cols-2 gap-4">
        {plans.map((plan, i) => (
          <li key={plan.url + i} className="flex gap-4 items-center rounded-xl border border-[#181512]/10 bg-[#FCFBF8] p-3">
            <div className="relative w-24 h-20 rounded-lg overflow-hidden bg-white border border-[#181512]/10 shrink-0">
              <Thumb url={plan.url} alt={plan.caption || 'Floor plan'} contain />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <TextInput
                className="!py-1.5 !text-xs"
                placeholder="Title (e.g. Typical Floor, Unit A)"
                value={plan.caption}
                onChange={(caption) => onChange(plans.map((p, j) => (j === i ? { ...p, caption } : p)))}
                aria-label="Plan title"
              />
              <div className="text-[10.5px] font-mono text-[#786F63] truncate">{plan.url}</div>
            </div>
            <div className="flex flex-col gap-1">
              <button type="button" className="p-1.5 text-[#786F63] hover:text-[#181512] disabled:opacity-25 cursor-pointer" disabled={i === 0} onClick={() => onChange(move(plans, i, -1))} aria-label="Move up">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1.5 text-[#786F63] hover:text-red-600 cursor-pointer" onClick={() => onChange(plans.filter((_, j) => j !== i))} aria-label="Remove plan">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

/* ── Video ─────────────────────────────────────────────────────── */

export const VideoEditor: React.FC<{ url?: string; onChange: (url: string) => void }> = ({ url, onChange }) => {
  const embed = videoEmbedUrl(url);
  return (
    <div className="space-y-4">
      <Field
        label="Video Link"
        htmlFor="video-url"
        hint={url?.trim() ? (embed ? 'Recognised. The video will play on the page.' : 'Not a YouTube/Vimeo link. Visitors will get a "Watch Video" button instead.') : 'YouTube or Vimeo watch / share link.'}
      >
        <TextInput id="video-url" value={url} placeholder="https://www.youtube.com/watch?v=…" onChange={onChange} />
      </Field>
      {embed && (
        <div className="max-w-lg rounded-xl overflow-hidden border border-[#181512]/12 aspect-video bg-black">
          <iframe src={embed} title="Video preview" className="w-full h-full" loading="lazy" allowFullScreen />
        </div>
      )}
    </div>
  );
};
