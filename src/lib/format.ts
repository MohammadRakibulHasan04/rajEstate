/* Formatting helpers tuned for the Bangladeshi market. */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function fromBnDigits(input: string | number): string {
  return String(input).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

/**
 * Parses a BDT amount from English or Bangla input.
 * Supports raw numbers ("28500000", "২,৮৫,০০,০০০") as well as Crore/Lakh expressions
 * ("৳ ২.৮৫ কোটি", "2.85 Crore", "২ কোটি ৫০ লক্ষ", "৮৫ লক্ষ").
 */
export function parseBdtInput(raw: string): number | null {
  const s = fromBnDigits(raw).replace(/,/g, '').trim();
  if (!s) return 0;

  let total = 0;
  let matchedUnit = false;

  const croreMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:কোটি|crore|cr\b)/i);
  if (croreMatch) {
    total += parseFloat(croreMatch[1]) * 1e7;
    matchedUnit = true;
  }

  const lakhMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:লক্ষ|লাখ|lakh|lac|l\b)/i);
  if (lakhMatch) {
    total += parseFloat(lakhMatch[1]) * 1e5;
    matchedUnit = true;
  }

  if (matchedUnit) {
    return Math.round(total);
  }

  const plainMatch = s.replace(/^৳\s*/, '').match(/^(\d+(?:\.\d+)?)$/);
  if (plainMatch) {
    return Math.round(parseFloat(plainMatch[1]));
  }

  return null;
}

/**
 * Parses either a single BDT price or a min–max BDT price range from English or Bangla text
 * (e.g. "৳ ১.৮ কোটি – ২.৫ কোটি", "১.৮ - ২.৫ কোটি", "৮৫ লক্ষ থেকে ১.২ কোটি").
 */
export function parseBdtRangeInput(raw: string): { amount: number; maxAmount?: number } | null {
  const s = fromBnDigits(raw).trim();
  if (!s) return { amount: 0, maxAmount: undefined };

  const rangeParts = s.split(/\s*(?:–|—|-|\bto\b|থেকে)\s*/i).filter(Boolean);
  if (rangeParts.length === 2 && /\d/.test(rangeParts[0]) && /\d/.test(rangeParts[1])) {
    let leftStr = rangeParts[0];
    const rightStr = rangeParts[1];
    // If left side has no unit (e.g. "৳ ১.৮") and right side has a unit ("২.৫ কোটি"), inherit the unit
    if (!/(?:কোটি|crore|cr\b|লক্ষ|লাখ|lakh|lac|l\b)/i.test(leftStr)) {
      const rightUnit = rightStr.match(/(কোটি|crore|cr\b|লক্ষ|লাখ|lakh|lac|l\b)/i);
      if (rightUnit) leftStr = `${leftStr} ${rightUnit[1]}`;
    }
    const minVal = parseBdtInput(leftStr);
    const maxVal = parseBdtInput(rightStr);
    if (minVal !== null && maxVal !== null) {
      return {
        amount: minVal,
        ...(maxVal > minVal ? { maxAmount: maxVal } : {}),
      };
    }
  }

  const single = parseBdtInput(s);
  if (single !== null) {
    return { amount: single, maxAmount: undefined };
  }
  return null;
}

/** 28500000 → "৳ ২.৮৫ কোটি" (default Bangla), or "৳ 2.85 Crore" when bn=false */
export function formatBdt(amount: number, opts: { bn?: boolean; short?: boolean } = {}): string {
  const useBn = opts.bn ?? true;
  if (!amount || amount <= 0) return useBn ? 'মূল্য আলোচনা সাপেক্ষে' : 'Price on request';
  const trim = (n: number) => (Math.round(n * 100) / 100).toString();
  let num: string;
  let unit: string;
  if (amount >= 1e7) {
    num = trim(amount / 1e7);
    unit = useBn ? 'কোটি' : opts.short ? 'Cr' : 'Crore';
  } else if (amount >= 1e5) {
    num = trim(amount / 1e5);
    unit = useBn ? 'লক্ষ' : opts.short ? 'L' : 'Lakh';
  } else {
    num = amount.toLocaleString('en-IN');
    unit = '';
  }
  if (useBn) return `৳ ${toBnDigits(num)} ${unit}`.trim();
  return `৳ ${num}${unit ? ' ' + unit : ''}`;
}

/** Formats a min–max BDT price range: (18000000, 25000000) → "৳ ১.৮ কোটি – ২.৫ কোটি" */
export function formatBdtRange(
  minAmount: number,
  maxAmount?: number,
  opts: { bn?: boolean; short?: boolean } = {}
): string {
  if (!maxAmount || maxAmount <= minAmount || minAmount <= 0) {
    return formatBdt(minAmount > 0 ? minAmount : maxAmount || 0, opts);
  }
  const minFormatted = formatBdt(minAmount, opts);
  const maxFormatted = formatBdt(maxAmount, opts).replace(/^৳\s*/, '');
  return `${minFormatted} – ${maxFormatted}`;
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
    .replace(/^-+|-+$/g, '')
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
