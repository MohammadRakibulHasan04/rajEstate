/* Formatting helpers tuned for the Bangladeshi market. */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** 28500000 → "2.85 Crore", 8500000 → "85 Lakh" */
export function formatBdt(amount: number, opts: { bn?: boolean; short?: boolean } = {}): string {
  if (!amount || amount <= 0) return opts.bn ? 'মূল্য আলোচনা সাপেক্ষে' : 'Price on request';
  const trim = (n: number) => (Math.round(n * 100) / 100).toString();
  let num: string;
  let unit: string;
  if (amount >= 1e7) {
    num = trim(amount / 1e7);
    unit = opts.bn ? 'কোটি' : opts.short ? 'Cr' : 'Crore';
  } else if (amount >= 1e5) {
    num = trim(amount / 1e5);
    unit = opts.bn ? 'লক্ষ' : opts.short ? 'L' : 'Lakh';
  } else {
    num = amount.toLocaleString('en-IN');
    unit = '';
  }
  if (opts.bn) return `৳ ${toBnDigits(num)} ${unit}`.trim();
  return `৳ ${num}${unit ? ' ' + unit : ''}`;
}

export function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-IN');
}

export function sqftToSqm(sqft: number): number {
  return Math.round(sqft * 0.092903);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

/** "2026-03" → months from now (negative if past). */
export function monthsUntil(yyyyMm?: string): number | null {
  if (!yyyyMm || !/^\d{4}-\d{2}$/.test(yyyyMm)) return null;
  const [y, m] = yyyyMm.split('-').map(Number);
  const now = new Date();
  return (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
}

export function formatMonth(yyyyMm?: string): string {
  if (!yyyyMm || !/^\d{4}-\d{2}$/.test(yyyyMm)) return yyyyMm || '—';
  const [y, m] = yyyyMm.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
