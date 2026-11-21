import React from 'react';
import {
  ArrowUpDown,
  ShieldCheck,
  Zap,
  Flame,
  PhoneCall,
  Video,
  Siren,
  Trees,
  Car,
  Dumbbell,
  Waves,
  Users,
  Landmark,
  Smile,
  Wifi,
  Sun,
  Droplets,
  BatteryCharging,
  KeyRound,
  Wind,
  Snowflake,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { AmenityIconKey, AmenityItem } from '../types/listing';

export interface AmenityIconMeta {
  key: AmenityIconKey;
  label: string;
  category: string;
  Icon: LucideIcon;
}

export const AMENITY_ICON_CATALOG: AmenityIconMeta[] = [
  { key: 'elevator', label: 'লিফট', category: 'উচ্চগতির লিফট সুবিধা', Icon: ArrowUpDown },
  { key: 'security', label: '২৪/৭ নিরাপত্তা', category: 'সার্বক্ষণিক প্রহরা ও গেট নিয়ন্ত্রণ', Icon: ShieldCheck },
  { key: 'generator', label: 'জেনারেটর ব্যাকআপ', category: 'সম্পূর্ণ সার্বক্ষণিক বিদ্যুৎ ব্যাকআপ', Icon: Zap },
  { key: 'gas', label: 'গ্যাস সংযোগ', category: 'রান্নাঘরে নিরবচ্ছিন্ন গ্যাস সরবরাহ', Icon: Flame },
  { key: 'intercom', label: 'ইন্টারকম সুবিধা', category: 'অভ্যন্তরীণ যোগাযোগ ব্যবস্থা', Icon: PhoneCall },
  { key: 'cctv', label: 'সিসিটিভি নজরদারি', category: '২৪ ঘণ্টা ভিডিও নজরদারি', Icon: Video },
  { key: 'fire-safety', label: 'অগ্নি নির্বাপক ব্যবস্থা', category: 'জরুরি জীবন রক্ষা ও নিরাপত্তা', Icon: Siren },
  { key: 'rooftop-garden', label: 'রুফটপ গার্ডেন', category: 'সুসজ্জিত সবুজ ছাদ ও বাগান', Icon: Trees },
  { key: 'parking', label: 'গাড়ি পার্কিং', category: 'নির্ধারিত ও নিরাপদ পার্কিং স্পেস', Icon: Car },
  { key: 'gym', label: 'জিম ও ফিটনেস', category: 'স্বাস্থ্য ও শরীরচর্চা কেন্দ্র', Icon: Dumbbell },
  { key: 'pool', label: 'সুইমিং পুল', category: 'পরিচ্ছন্ন ও আধুনিক সুইমিং পুল', Icon: Waves },
  { key: 'community-hall', label: 'কমিউনিটি হল', category: 'সামাজিক মিলনমেলা ও সভার স্থান', Icon: Users },
  { key: 'prayer-room', label: 'নামাজের স্থান', category: 'শান্তিময় ইবাদতের জায়গা', Icon: Landmark },
  { key: 'playground', label: 'বাচ্চাদের খেলার জায়গা', category: 'পারিবারিক বিনোদন ও খেলার স্থান', Icon: Smile },
  { key: 'wifi', label: 'হাই-স্পিড ইন্টারনেট', category: 'দ্রুতগতির ফাইবার সংযোগ', Icon: Wifi },
  { key: 'solar', label: 'সোলার প্যানেল', category: 'পরিবেশবান্ধব নবায়নযোগ্য জ্বালানি', Icon: Sun },
  { key: 'water-filter', label: 'বিশুদ্ধ পানির ফিল্টার', category: 'নিরাপদ ও বিশুদ্ধ পানির সংস্থান', Icon: Droplets },
  { key: 'ev-charging', label: 'ইভি চার্জিং স্টেশন', category: 'বৈদ্যুতিক গাড়ি চার্জিং পয়েন্ট', Icon: BatteryCharging },
  { key: 'concierge', label: 'রিসেপশন ও লাউঞ্জ', category: 'স্বাগতম ও রিসেপশন লাউঞ্জ', Icon: KeyRound },
  { key: 'balcony', label: 'উন্মুক্ত আলো-বাতাস', category: 'প্রাকৃতিক আলো ও বাতাসের ব্যবস্থা', Icon: Wind },
  { key: 'air-conditioning', label: 'শীতাতপ নিয়ন্ত্রণ', category: 'আরামদায়ক সেন্ট্রাল বা স্প্লিট এসি', Icon: Snowflake },
  { key: 'sparkles', label: 'বিশেষ সুবিধা', category: 'আকর্ষণীয় অতিরিক্ত সুবিধা', Icon: Sparkles },
];

const ICON_MAP: Record<AmenityIconKey, AmenityIconMeta> = Object.fromEntries(
  AMENITY_ICON_CATALOG.map((item) => [item.key, item])
) as Record<AmenityIconKey, AmenityIconMeta>;

export const COMMON_AMENITY_PRESETS: AmenityItem[] = [
  { label: 'লিফট', icon: 'elevator' },
  { label: '২৪/৭ নিরাপত্তা', icon: 'security' },
  { label: 'জেনারেটর ব্যাকআপ', icon: 'generator' },
  { label: 'গ্যাস সংযোগ', icon: 'gas' },
  { label: 'ইন্টারকম', icon: 'intercom' },
  { label: 'সিসিটিভি', icon: 'cctv' },
  { label: 'অগ্নি নির্বাপক ব্যবস্থা', icon: 'fire-safety' },
  { label: 'রুফটপ গার্ডেন', icon: 'rooftop-garden' },
  { label: 'গাড়ি পার্কিং', icon: 'parking' },
  { label: 'জিম ও ফিটনেস', icon: 'gym' },
  { label: 'সুইমিং পুল', icon: 'pool' },
  { label: 'কমিউনিটি হল', icon: 'community-hall' },
  { label: 'নামাজের স্থান', icon: 'prayer-room' },
  { label: 'বাচ্চাদের খেলার জায়গা', icon: 'playground' },
  { label: 'সোলার প্যানেল', icon: 'solar' },
];

const BANGLA_LABEL_MAP: Record<string, string> = {
  'lift': 'লিফট',
  'elevator': 'লিফট',
  'passenger lift': 'প্যাসেঞ্জার লিফট',
  'high-speed lift': 'উচ্চগতির লিফট',
  '24/7 security': '২৪/৭ নিরাপত্তা',
  'security': '২৪/৭ নিরাপত্তা',
  'security guard': 'নিরাপত্তা প্রহরী',
  'generator': 'জেনারেটর ব্যাকআপ',
  'generator backup': 'জেনারেটর ব্যাকআপ',
  'power backup': 'বিদ্যুৎ ব্যাকআপ',
  'backup generator': 'জেনারেটর ব্যাকআপ',
  'gas': 'গ্যাস সংযোগ',
  'gas line': 'গ্যাস সংযোগ',
  'intercom': 'ইন্টারকম সুবিধা',
  'cctv': 'সিসিটিভি নজরদারি',
  'cctv surveillance': 'সিসিটিভি নজরদারি',
  'fire safety': 'অগ্নি নির্বাপক ব্যবস্থা',
  'fire extinguisher': 'অগ্নিনির্বাপক ব্যবস্থা',
  'rooftop garden': 'রুফটপ গার্ডেন',
  'garden': 'বাগান ও ছাদ',
  'car parking': 'গাড়ি পার্কিং',
  'parking': 'গাড়ি পার্কিং',
  'gym': 'জিম ও ফিটনেস',
  'gymnasium': 'জিম ও ফিটনেস',
  'fitness & gym': 'জিম ও ফিটনেস',
  'swimming pool': 'সুইমিং পুল',
  'pool': 'সুইমিং পুল',
  'community hall': 'কমিউনিটি হল',
  'prayer room': 'নামাজের স্থান',
  'mosque': 'নামাজের স্থান',
  'kids play area': 'বাচ্চাদের খেলার জায়গা',
  'kids play zone': 'বাচ্চাদের খেলার জায়গা',
  'playground': 'বাচ্চাদের খেলার জায়গা',
  'wifi': 'হাই-স্পিড ইন্টারনেট',
  'fiber internet': 'হাই-স্পিড ইন্টারনেট',
  'solar': 'সোলার প্যানেল',
  'solar power': 'সোলার প্যানেল',
  'solar panels': 'সোলার প্যানেল',
  'water filter': 'বিশুদ্ধ পানির ফিল্টার',
  'water filtration': 'বিশুদ্ধ পানির ফিল্টার',
  'ev charging': 'ইভি চার্জিং স্টেশন',
  'reception lobby': 'রিসেপশন ও লাউঞ্জ',
  'concierge': 'রিসেপশন ও লাউঞ্জ',
  'cross ventilation': 'উন্মুক্ত আলো-বাতাস',
  'balcony': 'উন্মুক্ত আলো-বাতাস',
  'air conditioning': 'শীতাতপ নিয়ন্ত্রণ',
  'climate control': 'শীতাতপ নিয়ন্ত্রণ',
  'signature feature': 'বিশেষ সুবিধা',
};

const BANGLA_DETAIL_MAP: Record<string, string> = {
  'high-speed passenger lift': 'উচ্চগতির প্যাসেঞ্জার লিফট',
  'guarded entry & patrol': 'সার্বক্ষণিক প্রহরী ও গেট নিয়ন্ত্রণ',
  'full backup power': 'সম্পূর্ণ সার্বক্ষণিক বিদ্যুৎ ব্যাকআপ',
  'dedicated kitchen supply': 'রান্নাঘরে নিরবচ্ছিন্ন গ্যাস সরবরাহ',
  'gate-to-residence line': 'গেট ও সিকিউরিটির সাথে সরাসরি যোগাযোগ',
  '24-hour camera coverage': '২৪ ঘণ্টা ক্যামেরা নজরদারি',
  'detection & extinguishers': 'স্মোক ডিটেক্টর ও অগ্নিনির্বাপক সুবিধা',
  'landscaped roof terrace': 'সুসজ্জিত সবুজ ছাদ ও বসার স্থান',
  'reserved ground bay': 'নির্ধারিত ও নিরাপদ পার্কিং স্পেস',
  'residents fitness suite': 'ব্যায়াম ও স্বাস্থ্যচর্চা কেন্দ্র',
  'temperature-controlled pool': 'আধুনিক ও পরিচ্ছন্ন সুইমিং পুল',
  'event & lounge space': 'সামাজিক অনুষ্ঠান ও সভার স্থান',
  'dedicated prayer space': 'শান্তিময় ইবাদতের জায়গা',
  'safe outdoor play zone': 'নিরাপদ উন্মুক্ত খেলাধুলার স্থান',
  'renewable roof grid': 'পরিবেশবান্ধব সৌর বিদ্যুৎ সংযোগ',
};

/** Checks if a string contains any Bengali characters */
export function hasBengaliChars(str: string): boolean {
  return /[\u0980-\u09FF]/.test(str);
}

/** Translates an amenity label into Bengali. If it is already Bengali, returns it directly. */
export function toBanglaAmenityLabel(label: string): string {
  if (!label || !label.trim()) return '';
  const trimmed = label.trim();
  if (hasBengaliChars(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  if (BANGLA_LABEL_MAP[lower]) return BANGLA_LABEL_MAP[lower];
  // Match partials or infer by icon catalog
  const inferredIcon = inferAmenityIcon(trimmed);
  if (inferredIcon && ICON_MAP[inferredIcon]) {
    return ICON_MAP[inferredIcon].label;
  }
  return trimmed;
}

/** Translates an amenity detail/subtitle into Bengali. If empty, returns empty string. */
export function toBanglaAmenityDetail(detail?: string): string {
  if (detail && detail.trim()) {
    const trimmed = detail.trim();
    if (hasBengaliChars(trimmed)) return trimmed;
    const lower = trimmed.toLowerCase();
    if (BANGLA_DETAIL_MAP[lower]) return BANGLA_DETAIL_MAP[lower];
    return trimmed;
  }
  return '';
}

/** Infers the best matching icon key from a Bengali or English amenity label. */
export function inferAmenityIcon(label: string): AmenityIconKey {
  const s = (label || '').toLowerCase();
  if (/লিফট|lift|elevator/.test(s)) return 'elevator';
  if (/নিরাপত্তা|প্রহরী| দারোয়ান|security|guard|gated/.test(s)) return 'security';
  if (/জেনারেটর|বিদ্যুৎ|পাওয়ার|generator|backup|ips|power/.test(s)) return 'generator';
  if (/গ্যাস|gas|lpg|titas/.test(s)) return 'gas';
  if (/ইন্টারকম|intercom|telephone|pabx/.test(s)) return 'intercom';
  if (/সিসিটিভি|ক্যামেরা|cctv|camera|surveillance/.test(s)) return 'cctv';
  if (/ফায়ার|অগ্নি|fire|hydrant|extinguisher|alarm/.test(s)) return 'fire-safety';
  if (/বাগান|ছাদ|সবুজ|garden|rooftop|terrace|lawn|green/.test(s)) return 'rooftop-garden';
  if (/পার্কিং|গ্যারেজ|parking|garage|car/.test(s)) return 'parking';
  if (/জিম|ফিটনেস|ব্যায়াম|gym|fitness|workout/.test(s)) return 'gym';
  if (/পুল|সুইমিং|pool|swim|jacuzzi|spa/.test(s)) return 'pool';
  if (/কমিউনিটি|হল|লাউঞ্জ|community|hall|club|lounge|banquet/.test(s)) return 'community-hall';
  if (/নামাজ|মসজিদ|প্রার্থনা|prayer|mosque|masjid/.test(s)) return 'prayer-room';
  if (/শিশু|খেলার|play|kids|children/.test(s)) return 'playground';
  if (/ওয়াইফাই|ইন্টারনেট|wifi|internet|broadband|fiber/.test(s)) return 'wifi';
  if (/সোলার|সৌর|solar/.test(s)) return 'solar';
  if (/পানি|ওয়াটার|ফিল্টার|water|filter|purif|wasa/.test(s)) return 'water-filter';
  if (/ইভি|চার্জ|ev|charging|charger/.test(s)) return 'ev-charging';
  if (/লবি|রিসেপশন|কনসিয়ার্জ|lobby|reception|concierge/.test(s)) return 'concierge';
  if (/বাতাস|ভেন্টিলেশন|ব্যালকনি|ventilation|breeze|balcony|air/.test(s)) return 'balcony';
  if (/এসি|শীতাতপ|ac|air.?condition|hvac|cooling/.test(s)) return 'air-conditioning';
  return 'sparkles';
}

/** Normalizes any string or partial AmenityItem into a complete AmenityItem with Bangla text. */
export function normalizeAmenity(raw: unknown): AmenityItem | null {
  if (typeof raw === 'string') {
    const rawLabel = raw.trim();
    if (!rawLabel) return null;
    const label = toBanglaAmenityLabel(rawLabel);
    const icon = inferAmenityIcon(label || rawLabel);
    return { label: label || rawLabel, icon };
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const rawLabel = typeof obj.label === 'string' ? obj.label.trim() : '';
    const label = toBanglaAmenityLabel(rawLabel);
    if (!label && typeof obj.icon !== 'string') return null;
    const rawIcon = typeof obj.icon === 'string' ? (obj.icon as AmenityIconKey) : undefined;
    const icon: AmenityIconKey = rawIcon && ICON_MAP[rawIcon] ? rawIcon : inferAmenityIcon(label || rawLabel);
    const rawDetail = typeof obj.detail === 'string' && obj.detail.trim() ? obj.detail.trim() : undefined;
    const detail = rawDetail ? toBanglaAmenityDetail(rawDetail) : undefined;
    return { label: label || rawLabel, icon, ...(detail ? { detail } : {}) };
  }
  return null;
}

export function normalizeAmenities(list: unknown): AmenityItem[] {
  if (!Array.isArray(list)) return [];
  const out: AmenityItem[] = [];
  for (const item of list) {
    if (item && typeof item === 'object' && 'label' in item) {
      const obj = item as { label?: string; icon?: AmenityIconKey; detail?: string };
      const rawLabel = typeof obj.label === 'string' ? obj.label.trim() : '';
      const label = toBanglaAmenityLabel(rawLabel);
      const icon = obj.icon && ICON_MAP[obj.icon] ? obj.icon : inferAmenityIcon(label || rawLabel);
      const detail = obj.detail ? toBanglaAmenityDetail(obj.detail) : undefined;
      out.push({
        label: label || rawLabel,
        icon,
        ...(detail ? { detail } : {}),
      });
    } else if (typeof item === 'string') {
      const n = normalizeAmenity(item);
      if (n) out.push(n);
    }
  }
  return out;
}

export function getAmenityIconMeta(icon?: AmenityIconKey, label = ''): AmenityIconMeta {
  const key = icon && ICON_MAP[icon] ? icon : inferAmenityIcon(label);
  return ICON_MAP[key] || ICON_MAP.sparkles;
}

export const AmenityIconView: React.FC<{
  icon?: AmenityIconKey;
  label?: string;
  className?: string;
}> = ({ icon, label = '', className = 'w-5 h-5' }) => {
  const { Icon } = getAmenityIconMeta(icon, label);
  return <Icon className={className} />;
};
