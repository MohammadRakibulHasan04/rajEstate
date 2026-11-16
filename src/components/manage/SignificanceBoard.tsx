import React, { useMemo, useState } from 'react';
import { GripVertical, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { Fact, FactTier, Listing } from '../../types/listing';
import { deriveCoreFacts, syncFacts } from '../../lib/significance';

const TIERS: { tier: FactTier; title: string; hint: string; max?: number }[] = [
  { tier: 'signature', title: 'Signature', hint: 'The 1–3 reasons someone buys this home. Shown full-width after the hero.', max: 3 },
  { tier: 'defining', title: 'Defining', hint: 'Shown beside the floor plan, each with its reason.' },
  { tier: 'reference', title: 'Reference', hint: 'Quietly listed in the full specification.' },
];

interface Props {
  listing: Listing;
  onChange: (facts: Fact[]) => void;
}

/**
 * Every fact must earn its place. Admins rank facts into tiers and
 * explain each one. Facts derived from specs update automatically.
 */
export const SignificanceBoard: React.FC<Props> = ({ listing, onChange }) => {
  const facts = useMemo(() => syncFacts(listing), [listing]);
  const derived = useMemo(() => new Map(deriveCoreFacts(listing).map((f) => [f.key, f])), [listing]);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overTier, setOverTier] = useState<FactTier | null>(null);
  const [draft, setDraft] = useState({ label: '', value: '', why: '' });

  const update = (key: string, patch: Partial<Fact>) => onChange(facts.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  const count = (t: FactTier) => facts.filter((f) => f.tier === t).length;

  const moveTo = (key: string, tier: FactTier) => {
    const f = facts.find((x) => x.key === key);
    if (!f || f.tier === tier) return;
    if (tier === 'signature' && count('signature') >= 3) return;
    update(key, { tier });
  };

  const addCustom = () => {
    if (!draft.label.trim() || !draft.value.trim()) return;
    onChange([...facts, { key: `custom-${Date.now().toString(36)}`, label: draft.label.trim(), value: draft.value.trim(), why: draft.why.trim(), tier: 'defining' }]);
    setDraft({ label: '', value: '', why: '' });
  };

  return (
    <div className="space-y-8">
      <div className="grid xl:grid-cols-3 gap-5">
        {TIERS.map(({ tier, title, hint, max }) => {
          const list = facts.filter((f) => f.tier === tier);
          const full = max !== undefined && list.length >= max;
          return (
            <div
              key={tier}
              onDragOver={(e) => {
                e.preventDefault();
                setOverTier(tier);
              }}
              onDragLeave={() => setOverTier(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (dragKey) moveTo(dragKey, tier);
                setDragKey(null);
                setOverTier(null);
              }}
              className={`rounded-2xl border p-4 min-h-[220px] transition-colors duration-300 ${
                overTier === tier && !(full && facts.find((f) => f.key === dragKey)?.tier !== tier)
                  ? 'border-[#9A6B3B] bg-[#9A6B3B]/[0.08]'
                  : tier === 'signature'
                    ? 'border-[#9A6B3B]/35 bg-[#9A6B3B]/[0.04]'
                    : 'border-[#181512]/10 bg-[#F3EFE7]/70'
              }`}
            >
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="font-display text-xl text-[#181512] flex items-center gap-2">
                  {tier === 'signature' && <Sparkles className="w-4 h-4 text-[#9A6B3B]" />}
                  {title}
                </h3>
                <span className={`text-[10px] font-mono tracking-[0.2em] ${full ? 'text-[#9A6B3B]' : 'text-[#786F63]'}`}>
                  {list.length}{max ? ` / ${max}` : ''}
                </span>
              </div>
              <p className="text-[12px] text-[#6E6559] mb-4 leading-snug">{hint}</p>

              <div className="space-y-3">
                {list.map((f) => {
                  const auto = derived.get(f.key);
                  const isCustom = !auto;
                  const missingWhy = tier !== 'reference' && !f.why?.trim();
                  return (
                    <article
                      key={f.key}
                      draggable
                      onDragStart={() => setDragKey(f.key)}
                      onDragEnd={() => setDragKey(null)}
                      className={`rounded-xl border bg-[#FCFBF8] p-3.5 shadow-2xs transition-opacity ${dragKey === f.key ? 'opacity-40' : ''} ${
                        missingWhy ? 'border-amber-500/45' : 'border-[#181512]/10'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-[#8C8275] mt-1 cursor-grab shrink-0" />
                        <div className="flex-1 min-w-0">
                          {isCustom ? (
                            <div className="grid grid-cols-2 gap-2">
                              <input className="lux-input !py-2 !text-[13px]" value={f.label} onChange={(e) => update(f.key, { label: e.target.value })} aria-label="Fact label" />
                              <input className="lux-input !py-2 !text-[13px]" value={f.value} onChange={(e) => update(f.key, { value: e.target.value })} aria-label="Fact value" />
                            </div>
                          ) : (
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="mono-label">{f.label}</span>
                              <span className="font-display text-lg text-[#181512] text-right truncate">{f.value}</span>
                            </div>
                          )}
                          <textarea
                            className="lux-textarea !min-h-[64px] !py-2 !text-[13px] mt-2"
                            placeholder={tier === 'reference' ? 'Why it matters (optional)' : 'Why does this matter to the buyer?'}
                            value={f.why ?? ''}
                            onChange={(e) => update(f.key, { why: e.target.value })}
                            aria-label={`Why ${f.label} matters`}
                          />
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            {TIERS.filter((t) => t.tier !== tier).map((t) => (
                              <button
                                key={t.tier}
                                type="button"
                                onClick={() => moveTo(f.key, t.tier)}
                                disabled={t.tier === 'signature' && count('signature') >= 3}
                                className="px-2 py-1 rounded-md text-[9.5px] font-mono tracking-[0.14em] uppercase text-[#5C5346] border border-[#181512]/12 bg-[#F6F2EA] hover:text-[#5C3D1E] hover:border-[#9A6B3B]/50 disabled:opacity-30 cursor-pointer"
                              >
                                → {t.title}
                              </button>
                            ))}
                            <span className="flex-1" />
                            {auto?.why && f.why !== auto.why && (
                              <button type="button" onClick={() => update(f.key, { why: auto.why })} className="p-1 text-[#786F63] hover:text-[#9A6B3B] cursor-pointer" title="Use suggested reason">
                                <Wand2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isCustom && (
                              <button type="button" onClick={() => onChange(facts.filter((x) => x.key !== f.key))} className="p-1 text-[#786F63] hover:text-red-600 cursor-pointer" title="Remove fact">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {list.length === 0 && <p className="text-[12px] text-[#8C8275] italic py-6 text-center">Drag facts here</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-[#181512]/20 bg-[#F6F2EA]/50 p-5">
        <div className="mono-label mb-3">Add a fact the specs can't capture</div>
        <div className="grid md:grid-cols-[1fr_1fr_2fr_auto] gap-3">
          <input className="lux-input" placeholder="Label, e.g. Rooftop" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          <input className="lux-input" placeholder="Value, e.g. Shared garden" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />
          <input className="lux-input" placeholder="Why it matters" value={draft.why} onChange={(e) => setDraft({ ...draft, why: e.target.value })} />
          <button type="button" id="fact-add" onClick={addCustom} disabled={!draft.label.trim() || !draft.value.trim()} className="btn-quiet justify-center">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
};
