import React, { useState } from 'react';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { Unit, UnitStatus } from '../../types/listing';
import { formatBdt } from '../../lib/format';

const FACINGS = ['South', 'South-East', 'East', 'North-East', 'North', 'North-West', 'West', 'South-West'];

interface Props {
  units: Unit[];
  onChange: (u: Unit[]) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

/** Units table with a bulk generator for whole floors. */
export const UnitsEditor: React.FC<Props> = ({ units, onChange }) => {
  const [gen, setGen] = useState({ fromFloor: 2, toFloor: 10, letters: 'A,B', sizeSqft: 1500, beds: 3, baths: 3, balconies: 2, facing: 'South', basePrice: 15000000, perFloor: 200000 });
  const [open, setOpen] = useState(units.length === 0);

  const update = (id: string, patch: Partial<Unit>) => onChange(units.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const generate = () => {
    const letters = gen.letters.split(',').map((s) => s.trim()).filter(Boolean);
    const existing = new Set(units.map((u) => u.code));
    const created: Unit[] = [];
    for (let f = gen.fromFloor; f <= gen.toFloor; f++) {
      for (const L of letters) {
        const code = `${f}${L}`;
        if (existing.has(code)) continue;
        created.push({
          id: uid(),
          code,
          floor: f,
          sizeSqft: gen.sizeSqft,
          beds: gen.beds,
          baths: gen.baths,
          balconies: gen.balconies,
          facing: gen.facing,
          price: gen.basePrice + (f - gen.fromFloor) * gen.perFloor,
          status: 'available',
        });
      }
    }
    onChange([...units, ...created].sort((a, b) => a.floor - b.floor || a.code.localeCompare(b.code)));
    setOpen(false);
  };

  const num = (v: string) => (v === '' ? 0 : Number(v));
  const g = (k: keyof typeof gen, v: string) => setGen({ ...gen, [k]: k === 'letters' || k === 'facing' ? v : num(v) });

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#d1ad7a]/25 bg-[#d1ad7a]/[0.03] p-5">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-sm text-[#f1dfbd] cursor-pointer">
          <Wand2 className="w-4 h-4" /> Generate units for a range of floors
        </button>
        {open && (
          <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
            {(
              [
                ['fromFloor', 'From floor'],
                ['toFloor', 'To floor'],
                ['letters', 'Unit letters'],
                ['sizeSqft', 'Size (sq ft)'],
                ['beds', 'Beds'],
                ['baths', 'Baths'],
                ['balconies', 'Balconies'],
                ['basePrice', 'Base price ৳'],
                ['perFloor', '+ per floor ৳'],
              ] as [keyof typeof gen, string][]
            ).map(([k, label]) => (
              <label key={k} className="block">
                <span className="mono-label block mb-1.5">{label}</span>
                <input className="lux-input !py-2.5" value={gen[k]} onChange={(e) => g(k, e.target.value)} type={k === 'letters' ? 'text' : 'number'} />
              </label>
            ))}
            <label className="block">
              <span className="mono-label block mb-1.5">Facing</span>
              <select className="lux-select !py-2.5" value={gen.facing} onChange={(e) => g('facing', e.target.value)}>
                {FACINGS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </label>
            <div className="col-span-2 md:col-span-5 flex items-center justify-between gap-4 pt-2">
              <span className="text-[12px] text-slate-500">
                Creates {Math.max(0, gen.toFloor - gen.fromFloor + 1) * gen.letters.split(',').filter((s) => s.trim()).length} units. Existing codes are skipped. Run again with a different size or facing for "B" units.
              </span>
              <button type="button" id="units-generate" onClick={generate} className="btn-gold !py-3">Generate</button>
            </div>
          </div>
        )}
      </div>

      {units.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="w-full text-sm min-w-[880px]">
            <thead>
              <tr className="text-left border-b border-white/[0.08] bg-white/[0.02]">
                {['Code', 'Floor', 'Sq ft', 'Bed', 'Bath', 'Facing', 'Price ৳', 'Status', 'Plan URL', ''].map((h) => (
                  <th key={h} className="px-3 py-3 mono-label font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} className="border-b border-white/[0.05] hover:bg-white/[0.015]">
                  <td className="px-2 py-1.5 w-20"><input className="lux-input !py-1.5 !px-2 !text-[13px]" value={u.code} onChange={(e) => update(u.id, { code: e.target.value })} /></td>
                  <td className="px-2 py-1.5 w-20"><input type="number" className="lux-input !py-1.5 !px-2 !text-[13px]" value={u.floor} onChange={(e) => update(u.id, { floor: num(e.target.value) })} /></td>
                  <td className="px-2 py-1.5 w-24"><input type="number" className="lux-input !py-1.5 !px-2 !text-[13px]" value={u.sizeSqft} onChange={(e) => update(u.id, { sizeSqft: num(e.target.value) })} /></td>
                  <td className="px-2 py-1.5 w-16"><input type="number" className="lux-input !py-1.5 !px-2 !text-[13px]" value={u.beds} onChange={(e) => update(u.id, { beds: num(e.target.value) })} /></td>
                  <td className="px-2 py-1.5 w-16"><input type="number" className="lux-input !py-1.5 !px-2 !text-[13px]" value={u.baths} onChange={(e) => update(u.id, { baths: num(e.target.value) })} /></td>
                  <td className="px-2 py-1.5 w-32">
                    <select className="lux-select !py-1.5 !px-2 !text-[13px]" value={u.facing} onChange={(e) => update(u.id, { facing: e.target.value })}>
                      {FACINGS.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 w-36">
                    <input type="number" className="lux-input !py-1.5 !px-2 !text-[13px]" value={u.price} onChange={(e) => update(u.id, { price: num(e.target.value) })} />
                    <span className="block text-[10px] font-mono text-slate-500 mt-0.5 px-1">{formatBdt(u.price, { short: true })}</span>
                  </td>
                  <td className="px-2 py-1.5 w-32">
                    <select
                      className={`lux-select !py-1.5 !px-2 !text-[13px] ${u.status === 'available' ? '!text-[#f1dfbd]' : u.status === 'sold' ? '!text-slate-500' : ''}`}
                      value={u.status}
                      onChange={(e) => update(u.id, { status: e.target.value as UnitStatus })}
                    >
                      <option value="available">Available</option>
                      <option value="booked">Booked</option>
                      <option value="sold">Sold</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5"><input className="lux-input !py-1.5 !px-2 !text-[13px]" placeholder="https://" value={u.floorPlanUrl ?? ''} onChange={(e) => update(u.id, { floorPlanUrl: e.target.value || undefined })} /></td>
                  <td className="px-2 py-1.5 w-10">
                    <button type="button" onClick={() => onChange(units.filter((x) => x.id !== u.id))} className="p-1.5 text-slate-500 hover:text-red-300 cursor-pointer" aria-label={`Remove unit ${u.code}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          id="unit-add"
          onClick={() => {
            const last = units[units.length - 1];
            onChange([...units, last ? { ...last, id: uid(), code: `${last.floor + 1}${last.code.replace(/^\d+/, '')}`, floor: last.floor + 1, status: 'available' } : { id: uid(), code: '1A', floor: 1, sizeSqft: 1200, beds: 3, baths: 2, balconies: 2, facing: 'South', price: 0, status: 'available' }]);
          }}
          className="btn-quiet"
        >
          <Plus className="w-3.5 h-3.5" /> Add unit
        </button>
        {units.length > 0 && (
          <span className="text-[11px] font-mono tracking-[0.18em] uppercase text-slate-500">
            {units.length} units · {units.filter((u) => u.status === 'available').length} available
          </span>
        )}
      </div>
    </div>
  );
};
