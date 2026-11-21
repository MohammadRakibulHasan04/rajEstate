import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, LayoutList, Plus, X } from 'lucide-react';
import { ListingSection } from '../../types/listing';
import { SECTION_META } from '../../lib/sections';

/** Dropdown listing the sections that can still be added, plus a custom section. */
export const AddSectionMenu: React.FC<{
  sections: ListingSection[];
  onEnable: (id: string) => void;
  onAddCustom: () => void;
}> = ({ sections, onEnable, onAddCustom }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const available = sections.filter((s) => !s.enabled && s.type !== 'custom');

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" id="add-section" className="btn-quiet" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Plus className="w-3.5 h-3.5" /> Add Section <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute z-30 mt-2 w-80 rounded-xl border border-[#181512]/12 bg-white shadow-[0_20px_50px_-20px_rgba(24,21,18,0.3)] p-1.5">
          {available.map((s) => {
            if (s.type === 'custom') return null;
            const meta = SECTION_META[s.type];
            return (
              <button key={s.id} type="button" role="menuitem" onClick={() => pick(() => onEnable(s.id))} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#9A6B3B]/[0.08] cursor-pointer">
                <span className="block text-sm font-medium text-[#181512]">{meta.label}</span>
                <span className="block text-xs text-[#6E6559] mt-0.5">{meta.description}</span>
              </button>
            );
          })}
          {available.length > 0 && <div className="my-1 h-px bg-[#181512]/[0.08]" />}
          <button type="button" role="menuitem" onClick={() => pick(onAddCustom)} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#9A6B3B]/[0.08] cursor-pointer flex items-start gap-2.5">
            <LayoutList className="w-4 h-4 text-[#9A6B3B] mt-0.5" />
            <span>
              <span className="block text-sm font-medium text-[#181512]">Custom Section</span>
              <span className="block text-xs text-[#6E6559] mt-0.5">Your own heading and text, e.g. Payment Plan.</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

/** Reorder / remove controls for a section card header. */
export const SectionControls: React.FC<{
  label: string;
  isFirst: boolean;
  isLast: boolean;
  isCustom: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}> = ({ label, isFirst, isLast, isCustom, onMove, onRemove }) => {
  const btn = 'p-2 rounded-lg text-[#5C5346] hover:text-[#181512] hover:bg-[#181512]/[0.05] disabled:opacity-25 cursor-pointer';
  return (
    <>
      <button type="button" className={btn} disabled={isFirst} onClick={() => onMove(-1)} aria-label={`Move ${label} up`} title="Move up">
        <ArrowUp className="w-4 h-4" />
      </button>
      <button type="button" className={btn} disabled={isLast} onClick={() => onMove(1)} aria-label={`Move ${label} down`} title="Move down">
        <ArrowDown className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-2 rounded-lg text-[#6E6559] hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
        onClick={() => {
          if (isCustom && !window.confirm(`Delete the "${label}" section? Its content will be lost.`)) return;
          onRemove();
        }}
        aria-label={isCustom ? `Delete ${label}` : `Hide ${label}`}
        title={isCustom ? 'Delete section' : 'Remove from page (content is kept)'}
      >
        <X className="w-4 h-4" />
      </button>
    </>
  );
};
