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
    {error ? <p className="mt-1.5 text-[12px] text-red-600">{error}</p> : hint ? <p className="mt-1.5 text-[12px] text-[#6E6559] leading-relaxed">{hint}</p> : null}
  </div>
);

export const EditorSection: React.FC<{
  id: string;
  index?: string;
  title: string;
  intro?: string;
  /** Header controls (e.g. reorder / remove). */
  actions?: React.ReactNode;
  /** Shown as a quiet badge next to the title. */
  badge?: string;
  children: React.ReactNode;
}> = ({ id, index, title, intro, actions, badge, children }) => (
  <section id={id} className="editor-section panel p-6 md:p-8 scroll-mt-28" aria-labelledby={`${id}-title`}>
    <header className="flex items-start justify-between gap-4 mb-7">
      <div className="flex items-start gap-4 min-w-0">
        {index && (
          <span className="font-mono text-xs text-[#9A6B3B] mt-2 shrink-0" aria-hidden="true">
            {index}
          </span>
        )}
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="font-display text-2xl text-[#181512] leading-tight flex items-center gap-3 flex-wrap">
            {title}
            {badge && <span className="px-2 py-0.5 rounded-md bg-[#181512]/[0.05] text-[10px] font-mono uppercase tracking-wider text-[#6E6559]">{badge}</span>}
          </h2>
          {intro && <p className="mt-1.5 text-sm text-[#5C5346] max-w-2xl leading-relaxed">{intro}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
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
      <span className={`absolute bottom-3 right-4 text-[10px] font-mono ${(value?.length ?? 0) > counter ? 'text-amber-700' : 'text-[#8C8275]'}`}>
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
            value === o.value ? 'border-[#9A6B3B] bg-[#9A6B3B]/10 shadow-xs' : 'border-[#181512]/12 bg-[#F6F2EA]/60 hover:border-[#181512]/25'
          }`}
        >
          <span className="block text-sm text-[#181512] font-medium">{o.label}</span>
          {o.hint && <span className="block text-[12px] text-[#6E6559] mt-1 leading-snug">{o.hint}</span>}
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
        checked ? 'bg-[#9A6B3B] border-[#9A6B3B]' : 'bg-[#E5DEC9] border-[#181512]/15'
      }`}
    >
      <span className={`absolute top-0.5 w-[18px] h-[18px] rounded-full transition-all duration-300 shadow-xs ${checked ? 'left-[22px] bg-[#FCFBF8]' : 'left-0.5 bg-[#FCFBF8]'}`} />
    </button>
    <span>
      <span className="block text-sm text-[#181512] font-medium">{label}</span>
      {hint && <span className="block text-[12px] text-[#6E6559] mt-0.5">{hint}</span>}
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
  max,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  create: () => T;
  addLabel: string;
  empty?: string;
  idPrefix: string;
  max?: number;
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
      {items.length === 0 && empty && <p className="text-sm text-[#6E6559] italic">{empty}</p>}
      {items.map((item, i) => (
        <div key={i} className="group relative rounded-xl border border-[#181512]/10 bg-[#F6F2EA]/75 p-4 pr-14">
          {render(item, (p) => update(i, p), i)}
          <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-70 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded-md text-[#5C5346] hover:text-[#181512] hover:bg-[#181512]/5 disabled:opacity-20 cursor-pointer" aria-label={`Move item ${i + 1} up`}>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-1.5 rounded-md text-[#5C5346] hover:text-[#181512] hover:bg-[#181512]/5 disabled:opacity-20 cursor-pointer" aria-label={`Move item ${i + 1} down`}>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-md text-[#6E6559] hover:text-red-600 hover:bg-red-500/10 cursor-pointer" aria-label={`Remove item ${i + 1}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
      {(max === undefined || items.length < max) && (
        <button type="button" id={`${idPrefix}-add`} onClick={() => onChange([...items, create()])} className="btn-quiet">
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </button>
      )}
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
          className={`toast panel-glass rounded-xl px-5 py-3.5 text-sm border font-medium ${
            t.tone === 'error' ? 'border-red-500/40 text-red-800 bg-[#FEF2F2]/95' : t.tone === 'info' ? 'border-[#181512]/15 text-[#181512]' : 'border-[#9A6B3B]/50 text-[#5C3D1E]'
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
