import React from 'react';
import { Plus } from 'lucide-react';
import { Fact } from '../../types/listing';
import { createId } from '../../lib/sections';
import { Repeater, TextInput } from './fields';

const PRESETS = ['Flooring', 'Kitchen', 'Bathroom Fittings', 'Ceiling Height', 'Windows', 'Doors', 'Electrical', 'Water Supply', 'Wall Finish'];

/** Simple label / value list for details not covered by the core specs. */
export const SpecificationsEditor: React.FC<{ facts: Fact[]; onChange: (facts: Fact[]) => void }> = ({ facts, onChange }) => {
  const used = new Set(facts.map((f) => f.label.trim().toLowerCase()));
  const create = (label = ''): Fact => ({ key: createId('spec'), label, value: '', tier: 'reference' });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.filter((p) => !used.has(p.toLowerCase())).map((p) => (
          <button key={p} type="button" className="chip !normal-case !tracking-normal !font-sans !text-xs" onClick={() => onChange([...facts, create(p)])}>
            <Plus className="w-3 h-3" /> {p}
          </button>
        ))}
      </div>
      <Repeater
        idPrefix="spec"
        items={facts}
        onChange={onChange}
        create={() => create()}
        addLabel="Add Specification"
        empty="No specifications yet. Use the suggestions above or add your own."
        max={40}
        render={(f, set) => (
          <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
            <TextInput className="!py-2 !text-xs" placeholder="Label (e.g. Flooring)" value={f.label} onChange={(label) => set({ label })} aria-label="Specification label" maxLength={60} />
            <TextInput className="!py-2 !text-xs" placeholder="Value (e.g. Homogeneous tiles)" value={f.value} onChange={(value) => set({ value })} aria-label="Specification value" maxLength={160} />
          </div>
        )}
      />
    </div>
  );
};
