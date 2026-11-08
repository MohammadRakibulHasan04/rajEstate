import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Check, Wand2 } from 'lucide-react';
import { AmenityIconKey, AmenityItem } from '../../types/listing';
import {
  AMENITY_ICON_CATALOG,
  COMMON_AMENITY_PRESETS,
  getAmenityIconMeta,
  inferAmenityIcon,
  normalizeAmenities,
} from '../../lib/amenities';
import { TextInput } from './fields';

interface AmenitiesEditorProps {
  value: AmenityItem[];
  onChange: (next: AmenityItem[]) => void;
}

export const AmenitiesEditor: React.FC<AmenitiesEditorProps> = ({ value, onChange }) => {
  const items = normalizeAmenities(value);
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);

  const updateAt = (index: number, patch: Partial<AmenityItem>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const removeAt = (index: number) => {
    if (openPickerIndex === index) setOpenPickerIndex(null);
    onChange(items.filter((_, i) => i !== index));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [picked] = next.splice(index, 1);
    next.splice(target, 0, picked);
    setOpenPickerIndex(null);
    onChange(next);
  };

  const addCustom = () => {
    const next: AmenityItem[] = [
      ...items,
      { label: '', icon: 'sparkles', detail: '' },
    ];
    onChange(next);
    setOpenPickerIndex(next.length - 1);
  };

  const togglePreset = (preset: AmenityItem) => {
    const existingIdx = items.findIndex(
      (i) => i.label.trim().toLowerCase() === preset.label.trim().toLowerCase()
    );
    if (existingIdx >= 0) {
      removeAt(existingIdx);
    } else {
      onChange([...items, { ...preset }]);
    }
  };

  return (
    <div className="space-y-5">
      {/* Quick-add preset chips with icons */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="mono-label !text-[9.5px] text-slate-400">
            Quick-Toggle Presets (Click to add or remove with icon)
          </span>
          <span className="text-[10px] font-mono text-[#d1ad7a]">
            {items.length} selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMMON_AMENITY_PRESETS.map((preset) => {
            const meta = getAmenityIconMeta(preset.icon, preset.label);
            const Icon = meta.Icon;
            const active = items.some(
              (i) => i.label.trim().toLowerCase() === preset.label.trim().toLowerCase()
            );
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => togglePreset(preset)}
                data-active={active}
                className="chip !py-1.5 !px-3 !normal-case !tracking-normal !font-sans !text-xs"
              >
                <Icon className="w-3.5 h-3.5 text-[#d1ad7a] shrink-0" />
                <span>{preset.label}</span>
                {active && <Check className="w-3 h-3 text-[#d1ad7a] ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Individual Amenity Cards List */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
          No amenities added yet. Click any preset above or add a custom amenity with an icon below.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const meta = getAmenityIconMeta(item.icon, item.label);
            const Icon = meta.Icon;
            const pickerOpen = openPickerIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-3.5 sm:p-4 space-y-3 transition-colors hover:border-white/15"
              >
                <div className="grid sm:grid-cols-[auto_1.2fr_1fr_auto] gap-3 items-center">
                  {/* Icon Picker Trigger */}
                  <button
                    type="button"
                    onClick={() => setOpenPickerIndex(pickerOpen ? null : idx)}
                    className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                      pickerOpen
                        ? 'border-[#d1ad7a] bg-[#d1ad7a]/15 text-[#f1dfbd]'
                        : 'border-[#d1ad7a]/35 bg-[#d1ad7a]/10 text-[#f4efe6] hover:border-[#d1ad7a]/70'
                    }`}
                    title="Choose amenity icon"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#070b14]/60 border border-[#d1ad7a]/30 flex items-center justify-center text-[#d1ad7a] shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-[92px]">
                      <span className="block text-[9px] font-mono uppercase tracking-[0.2em] text-[#d1ad7a]">
                        Icon
                      </span>
                      <span className="block text-xs text-[#f4efe6] truncate max-w-[110px]">
                        {meta.label}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#d1ad7a] transition-transform ${
                        pickerOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Amenity Name Input */}
                  <div>
                    <TextInput
                      className="!py-2.5 !text-xs"
                      placeholder="Amenity title (e.g. লিফট / High-Speed Lift)"
                      value={item.label}
                      onChange={(label) => {
                        const inferred = inferAmenityIcon(label);
                        const shouldAutoIcon =
                          !item.icon || item.icon === 'sparkles' || item.icon === inferAmenityIcon(item.label);
                        updateAt(idx, {
                          label,
                          ...(shouldAutoIcon ? { icon: inferred } : {}),
                        });
                      }}
                    />
                  </div>

                  {/* Optional Subtitle / Descriptor */}
                  <div>
                    <TextInput
                      className="!py-2.5 !text-xs"
                      placeholder={`Subtitle (default: ${meta.category})`}
                      value={item.detail || ''}
                      onChange={(detail) => updateAt(idx, { detail })}
                    />
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => updateAt(idx, { icon: inferAmenityIcon(item.label) })}
                      className="p-2 rounded-lg text-slate-400 hover:text-[#d1ad7a] hover:bg-white/[0.04] cursor-pointer"
                      title="Auto-detect icon from name"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAt(idx)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      title="Remove amenity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expandable Visual Icon Picker Grid */}
                {pickerOpen && (
                  <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="mono-label !text-[9.5px] text-[#d1ad7a]">
                        Select Icon for &ldquo;{item.label || 'Amenity'}&rdquo;
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenPickerIndex(null)}
                        className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {AMENITY_ICON_CATALOG.map((entry) => {
                        const EntryIcon = entry.Icon;
                        const selected = meta.key === entry.key;
                        return (
                          <button
                            key={entry.key}
                            type="button"
                            onClick={() => {
                              updateAt(idx, { icon: entry.key as AmenityIconKey });
                              setOpenPickerIndex(null);
                            }}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              selected
                                ? 'border-[#d1ad7a] bg-[#d1ad7a]/15 text-[#f1dfbd]'
                                : 'border-white/[0.08] bg-[#070b14]/60 text-slate-300 hover:border-[#d1ad7a]/45 hover:text-white'
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                selected
                                  ? 'bg-[#d1ad7a] text-[#120d07]'
                                  : 'bg-white/[0.04] text-[#d1ad7a]'
                              }`}
                            >
                              <EntryIcon className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[11px] leading-tight truncate">{entry.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={addCustom}
        className="btn-quiet !py-2.5 !px-4"
      >
        <Plus className="w-3.5 h-3.5 text-[#d1ad7a]" />
        <span>Add Amenity &amp; Icon</span>
      </button>
    </div>
  );
};
