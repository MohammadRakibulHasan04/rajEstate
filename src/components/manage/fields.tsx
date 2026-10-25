import React, { useCallback, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

/* ------------------------------------------------------------------
   Admin form primitives, all built on the lux-* design tokens.
------------------------------------------------------------------- */

export const Field: React.FC<{
  label: string;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  htmlFor?: string;
  children: React.ReactNode;
}> = ({ label, hint, error, className = '', htmlFor, children }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="mono-label block mb-2">
      {label}
    </label>
    {children}
    {error ? <p className="mt-1.5 text-[12px] text-red-300">{error}</p> : hint ? <p className="mt-1.5 text-[12px] text-slate-500 leading-relaxed">{hint}</p> : null}
  </div>
);

export const EditorSection: React.FC<{ id: string; index: string; title: string; titleBn?: string; intro?: string; children: React.ReactNode }> = ({
  id,
  index,
  title,
  titleBn,
  intro,
  children,
}) => (
  <section id={id} className="editor-section panel p-6 md:p-9">
    <header className="flex items-start gap-5 mb-8">
      <span className="text-outline font-display text-5xl leading-none select-none" aria-hidden="true">{index}</span>
      <div>
        <h2 className="font-display text-3xl text-[#f4efe6] leading-tight">
          {title} {titleBn && <span className="text-slate-500 text-2xl">· {titleBn}</span>}
        </h2>
        {intro && <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">{intro}</p>}
      </div>
    </header>
    <div className="space-y-6">{children}</div>
  </section>
);

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string | undefined;
  onChange: (v: string) => void;
};

export const TextInput: React.FC<InputProps> = ({ value, onChange, className = '', ...rest }) => (
  <input {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={`lux-input ${className}`} />
);

export const NumberInput: React.FC<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & { value: number | undefined; onChange: (v: number | undefined) => void }
> = ({ value, onChange, className = '', ...rest }) => (
  <input
    {...rest}
    type="number"
    inputMode="decimal"
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    className={`lux-input ${className}`}
  />
);

export const TextArea: React.FC<
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & { value: string | undefined; onChange: (v: string) => void; counter?: number }
> = ({ value, onChange, counter, className = '', ...rest }) => (
  <div className="relative">
    <textarea {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={`lux-textarea ${className}`} />
    {counter && (
      <span className={`absolute bottom-3 right-4 text-[10px] font-mono ${(value?.length ?? 0) > counter ? 'text-amber-300' : 'text-slate-600'}`}>
        {value?.length ?? 0}/{counter}
      </span>
    )}
  </div>
);

export function Select<T extends string>({
  value,
  onChange,
  options,
  id,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  id?: string;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className="lux-select">
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  idPrefix,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  idPrefix: string;
}) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="radiogroup">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          id={`${idPrefix}-${o.value}`}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
            value === o.value ? 'border-[#d1ad7a]/70 bg-[#d1ad7a]/10' : 'border-white/10 hover:border-white/25'
          }`}
        >
          <span className="block text-sm text-[#f4efe6]">{o.label}</span>
          {o.hint && <span className="block text-[12px] text-slate-500 mt-1 leading-snug">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; id: string; hint?: string }> = ({
  checked,
  onChange,
  label,
  id,
  hint,
}) => (
  <label htmlFor={id} className="flex items-start gap-4 cursor-pointer select-none">
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-11 h-6 rounded-full border transition-colors duration-300 cursor-pointer ${
        checked ? 'bg-[#d1ad7a] border-[#d1ad7a]' : 'bg-white/5 border-white/15'
      }`}
    >
      <span className={`absolute top-0.5 w-[18px] h-[18px] rounded-full transition-all duration-300 ${checked ? 'left-[22px] bg-[#120d07]' : 'left-0.5 bg-slate-300'}`} />
    </button>
    <span>
      <span className="block text-sm text-[#f4efe6]">{label}</span>
      {hint && <span className="block text-[12px] text-slate-500 mt-0.5">{hint}</span>}
    </span>
  </label>
);

/** Generic list editor with add / remove / reorder. */
export function Repeater<T>({
  items,
  onChange,
  render,
  create,
  addLabel,
  empty,
  idPrefix,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  create: () => T;
  addLabel: string;
  empty?: string;
  idPrefix: string;
}) {
  const update = (i: number, patch: Partial<T>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && empty && <p className="text-sm text-slate-500 italic">{empty}</p>}
      {items.map((item, i) => (
        <div key={i} className="group relative rounded-xl border border-white/[0.08] bg-[#05080f]/50 p-4 pr-14">
          {render(item, (p) => update(i, p), i)}
          <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 cursor-pointer" aria-label="Move up">
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 cursor-pointer" aria-label="Move down">
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-md text-slate-500 hover:text-red-300 hover:bg-red-500/10 cursor-pointer" aria-label="Remove">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
      <button type="button" id={`${idPrefix}-add`} onClick={() => onChange([...items, create()])} className="btn-quiet">
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </button>
    </div>
  );
}

/* ── Toasts ────────────────────────────────────────────────────── */

export interface ToastMsg {
  id: number;
  text: string;
  tone: 'ok' | 'error' | 'info';
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const push = useCallback((text: string, tone: ToastMsg['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const view = (
    <div className="fixed bottom-6 right-6 z-[200] space-y-2 max-w-sm" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast panel-glass rounded-xl px-5 py-3.5 text-sm border ${
            t.tone === 'error' ? 'border-red-400/40 text-red-200' : t.tone === 'info' ? 'border-white/15 text-slate-200' : 'border-[#d1ad7a]/50 text-[#f1dfbd]'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
  return { push, view };
}

/** Readable message from a Firestore error thrown by handleFirestoreError. */
export function errorText(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    const msg: string = parsed.error ?? raw;
    if (/permission|insufficient/i.test(msg)) return 'Permission denied. Deploy the updated firestore.rules and make sure you are an admin.';
    return msg;
  } catch {
    return raw;
  }
}
