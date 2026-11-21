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
      <div className="rounded-2xl border border-[#181512]/10 bg-[#F6F2EA]/75 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="mono-label !text-[9.5px] text-[#6E6559]">
            Quick add (click to toggle)
          </span>
          <span className="text-[10px] font-mono text-[#9A6B3B] font-medium">
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
                <Icon className="w-3.5 h-3.5 text-[#9A6B3B] shrink-0" />
                <span>{preset.label}</span>
                {active && <Check className="w-3 h-3 text-[#9A6B3B] ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Individual Amenity Cards List */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#181512]/15 bg-[#F6F2EA]/50 p-6 text-center text-xs text-[#786F63]">
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
                className="rounded-2xl border border-[#181512]/10 bg-[#FCFBF8] p-3.5 sm:p-4 space-y-3 transition-colors hover:border-[#9A6B3B]/45"
              >
                <div className="grid sm:grid-cols-[auto_1.2fr_1fr_auto] gap-3 items-center">
                  {/* Icon Picker Trigger */}
                  <button
                    type="button"
                    onClick={() => setOpenPickerIndex(pickerOpen ? null : idx)}
                    className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                      pickerOpen
                        ? 'border-[#9A6B3B] bg-[#9A6B3B]/15 text-[#5C3D1E]'
                        : 'border-[#9A6B3B]/35 bg-[#9A6B3B]/10 text-[#181512] hover:border-[#9A6B3B]'
                    }`}
                    title="Choose amenity icon"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#FCFBF8] border border-[#9A6B3B]/30 flex items-center justify-center text-[#9A6B3B] shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-[92px]">
                      <span className="block text-[9px] font-mono uppercase tracking-[0.2em] text-[#9A6B3B]">
                        Icon
                      </span>
                      <span className="block text-xs text-[#181512] font-medium truncate max-w-[110px]">
                        {meta.label}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#9A6B3B] transition-transform ${
                        pickerOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Amenity Name Input */}
                  <div>
                    <TextInput
                      className="!py-2.5 !text-xs"
                      placeholder="Amenity name (e.g. High-Speed Lift)"
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
                      className="p-2 rounded-lg text-[#6E6559] hover:text-[#9A6B3B] hover:bg-[#181512]/[0.04] cursor-pointer"
                      title="Auto-detect icon from name"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="p-2 rounded-lg text-[#6E6559] hover:text-[#181512] disabled:opacity-25 cursor-pointer"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="p-2 rounded-lg text-[#6E6559] hover:text-[#181512] disabled:opacity-25 cursor-pointer"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAt(idx)}
                      className="p-2 rounded-lg text-[#6E6559] hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                      title="Remove amenity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expandable Visual Icon Picker Grid */}
                {pickerOpen && (
                  <div className="pt-3 border-t border-[#181512]/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="mono-label !text-[9.5px] text-[#9A6B3B]">
                        Select Icon for &ldquo;{item.label || 'Amenity'}&rdquo;
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenPickerIndex(null)}
                        className="text-[10px] font-mono uppercase tracking-wider text-[#6E6559] hover:text-[#181512] cursor-pointer"
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
                                ? 'border-[#9A6B3B] bg-[#9A6B3B]/15 text-[#5C3D1E] font-medium'
                                : 'border-[#181512]/[0.09] bg-[#F6F2EA] text-[#3D362E] hover:border-[#9A6B3B]/50 hover:text-[#181512]'
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                selected
                                  ? 'bg-[#9A6B3B] text-white'
                                  : 'bg-[#FCFBF8] text-[#9A6B3B] border border-[#181512]/[0.06]'
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
        <Plus className="w-3.5 h-3.5 text-[#9A6B3B]" />
        <span>Add Custom Amenity</span>
      </button>
    </div>
  );
};
