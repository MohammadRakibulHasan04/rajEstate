import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { MediaImage } from '../../types/listing';

interface MediaUrlListProps {
  hero: MediaImage;
  onHeroChange: (hero: MediaImage) => void;
  gallery: MediaImage[];
  onGalleryChange: (gallery: MediaImage[]) => void;
  floorPlans: MediaImage[];
  onFloorPlansChange: (floorPlans: MediaImage[]) => void;
  videoUrl?: string;
  onVideoUrlChange?: (url: string) => void;
}

const ROOM_OPTIONS = [
  'Living',
  'Dining',
  'Master Suite',
  'Bedroom',
  'Kitchen',
  'Bath',
  'Balcony',
  'Terrace',
  'Exterior',
  'Aerial',
  'Detail',
  'Amenities',
];

export const MediaUrlList: React.FC<MediaUrlListProps> = ({
  hero,
  onHeroChange,
  gallery,
  onGalleryChange,
  floorPlans,
  onFloorPlansChange,
  videoUrl,
  onVideoUrlChange,
}) => {
  const [activeTab, setActiveTab] = useState<'hero' | 'gallery' | 'plans' | 'video'>('hero');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryRoom, setNewGalleryRoom] = useState('Living');
  const [newPlanUrl, setNewPlanUrl] = useState('');
  const [newPlanCaption, setNewPlanCaption] = useState('');

  const addGalleryItem = () => {
    if (!newGalleryUrl.trim()) return;
    onGalleryChange([
      ...gallery,
      { url: newGalleryUrl.trim(), room: newGalleryRoom, caption: '', captionBn: '' },
    ]);
    setNewGalleryUrl('');
  };

  const updateGalleryItem = (index: number, patch: Partial<MediaImage>) => {
    onGalleryChange(gallery.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeGalleryItem = (index: number) => {
    onGalleryChange(gallery.filter((_, i) => i !== index));
  };

  const moveGalleryItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    onGalleryChange(next);
  };

  const addFloorPlan = () => {
    if (!newPlanUrl.trim()) return;
    onFloorPlansChange([
      ...floorPlans,
      { url: newPlanUrl.trim(), caption: newPlanCaption.trim() || 'Floor plan' },
    ]);
    setNewPlanUrl('');
    setNewPlanCaption('');
  };

  const removeFloorPlan = (index: number) => {
    onFloorPlansChange(floorPlans.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-4">
        {[
          { id: 'hero', label: 'Hero Image', count: hero.url ? 1 : 0 },
          { id: 'gallery', label: 'Room Gallery', count: gallery.length },
          { id: 'plans', label: 'Architectural Plans', count: floorPlans.length },
          { id: 'video', label: 'Video Walkthrough', count: videoUrl ? 1 : 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`chip cursor-pointer ${
              activeTab === tab.id
                ? '!border-[#d1ad7a] !bg-[#d1ad7a]/10 !text-[#f1dfbd]'
                : ''
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Hero Tab */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-white/[0.08] bg-[#05080f]/50">
            <label className="block mb-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              Hero Cover Image URL *
            </label>
            <div className="flex gap-3">
              <input
                className="lux-input flex-1"
                placeholder="https://images.unsplash.com/... or /listings/barakah/front-view.jpg"
                value={hero.url}
                onChange={(e) => onHeroChange({ ...hero, url: e.target.value })}
              />
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <input
                className="lux-input !py-2 !text-xs"
                placeholder="Caption (e.g. Front elevation at dusk)"
                value={hero.caption || ''}
                onChange={(e) => onHeroChange({ ...hero, caption: e.target.value })}
              />
              <input
                className="lux-input !py-2 !text-xs"
                placeholder="Caption in Bangla (ঐচ্ছিক)"
                value={hero.captionBn || ''}
                onChange={(e) => onHeroChange({ ...hero, captionBn: e.target.value })}
              />
            </div>
          </div>

          {hero.url ? (
            <div className="relative aspect-[16/9] max-w-xl rounded-xl overflow-hidden border border-white/10 bg-[#0c1220]">
              <img
                src={hero.url}
                alt="Hero preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute top-3 left-3 panel-glass px-3 py-1 rounded-full text-[10px] font-mono tracking-widest text-[#f1dfbd] uppercase">
                Primary Elevation
              </div>
            </div>
          ) : (
            <div className="aspect-[16/9] max-w-xl rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500">
              <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-xs font-mono uppercase tracking-wider">No hero image set</span>
            </div>
          )}
        </div>
      )}

      {/* Gallery Tab */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          {/* Quick add */}
          <div className="p-4 rounded-xl border border-dashed border-[#d1ad7a]/30 bg-[#d1ad7a]/[0.02]">
            <span className="mono-label block mb-3">Add High-Res Photo</span>
            <div className="grid sm:grid-cols-[1fr_160px_auto] gap-3">
              <input
                className="lux-input"
                placeholder="Paste direct image URL..."
                value={newGalleryUrl}
                onChange={(e) => setNewGalleryUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addGalleryItem();
                  }
                }}
              />
              <select
                className="lux-select"
                value={newGalleryRoom}
                onChange={(e) => setNewGalleryRoom(e.target.value)}
              >
                {ROOM_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addGalleryItem}
                disabled={!newGalleryUrl.trim()}
                className="btn-gold !py-2.5 !px-5 justify-center"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Gallery items list */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((item, index) => (
              <div
                key={index}
                className="group relative rounded-xl border border-white/[0.08] bg-[#0c1220] overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-black/40 overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.caption || item.room || 'Gallery photo'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = '0.2';
                    }}
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full panel-glass text-[9px] font-mono uppercase tracking-wider text-[#d1ad7a]">
                      {item.room || 'General'}
                    </span>
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveGalleryItem(index, -1)}
                      className="p-1 rounded bg-black/60 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move earlier"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === gallery.length - 1}
                      onClick={() => moveGalleryItem(index, 1)}
                      className="p-1 rounded bg-black/60 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move later"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(index)}
                      className="p-1 rounded bg-red-950/60 text-red-300 hover:text-red-100 cursor-pointer"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <select
                      className="lux-select !py-1 !text-xs"
                      value={item.room || 'Living'}
                      onChange={(e) => updateGalleryItem(index, { room: e.target.value })}
                    >
                      {ROOM_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <input
                      className="lux-input !py-1 !text-xs"
                      placeholder="English caption"
                      value={item.caption || ''}
                      onChange={(e) => updateGalleryItem(index, { caption: e.target.value })}
                    />
                    <input
                      className="lux-input !py-1 !text-xs"
                      placeholder="বাংলা ক্যাপশন"
                      value={item.captionBn || ''}
                      onChange={(e) => updateGalleryItem(index, { captionBn: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {gallery.length === 0 && (
            <p className="text-sm text-slate-500 italic text-center py-8">
              No gallery photos added yet. Add rooms to give buyers a complete walk-through feeling.
            </p>
          )}
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-dashed border-[#d1ad7a]/30 bg-[#d1ad7a]/[0.02]">
            <span className="mono-label block mb-3">Add Floor Plan / Blueprint</span>
            <div className="grid sm:grid-cols-[1fr_200px_auto] gap-3">
              <input
                className="lux-input"
                placeholder="Blueprint / layout image URL..."
                value={newPlanUrl}
                onChange={(e) => setNewPlanUrl(e.target.value)}
              />
              <input
                className="lux-input"
                placeholder="Caption (e.g. Typical Floor)"
                value={newPlanCaption}
                onChange={(e) => setNewPlanCaption(e.target.value)}
              />
              <button
                type="button"
                onClick={addFloorPlan}
                disabled={!newPlanUrl.trim()}
                className="btn-gold !py-2.5 !px-5 justify-center"
              >
                <Plus className="w-4 h-4" /> Add Plan
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {floorPlans.map((plan, i) => (
              <div
                key={i}
                className="relative rounded-xl border border-white/[0.08] bg-[#0c1220] p-4 flex gap-4 items-center"
              >
                <div className="w-24 h-24 rounded-lg bg-black/60 overflow-hidden shrink-0 border border-white/5">
                  <img src={plan.url} alt={plan.caption || ''} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    className="lux-input !py-1 !text-xs"
                    value={plan.caption || ''}
                    placeholder="Plan Title"
                    onChange={(e) => {
                      const next = [...floorPlans];
                      next[i] = { ...plan, caption: e.target.value };
                      onFloorPlansChange(next);
                    }}
                  />
                  <div className="text-[11px] font-mono text-slate-500 truncate mt-1">
                    {plan.url}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFloorPlan(i)}
                  className="p-2 text-slate-500 hover:text-red-300 cursor-pointer"
                  title="Remove plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {floorPlans.length === 0 && (
            <p className="text-sm text-slate-500 italic text-center py-8">
              Floor plans give clarity to discerning clients. Add dimensioned floor drawings here.
            </p>
          )}
        </div>
      )}

      {/* Video Tab */}
      {activeTab === 'video' && onVideoUrlChange && (
        <div className="p-6 rounded-xl border border-white/[0.08] bg-[#05080f]/50 space-y-4 max-w-xl">
          <label className="block">
            <span className="mono-label block mb-2">Video Walkthrough / Tour URL</span>
            <input
              className="lux-input"
              placeholder="YouTube or Vimeo embed / share URL"
              value={videoUrl || ''}
              onChange={(e) => onVideoUrlChange(e.target.value)}
            />
          </label>
          <p className="text-xs text-slate-500 leading-relaxed">
            Paste a link to an architectural cinematic video or walkthrough of the residence.
          </p>
        </div>
      )}
    </div>
  );
};
