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
  { key: 'elevator', label: 'Elevator / Lift', category: 'Vertical Transit', Icon: ArrowUpDown },
  { key: 'security', label: '24/7 Security', category: 'Gated Protection', Icon: ShieldCheck },
  { key: 'generator', label: 'Backup Generator', category: 'Power Continuity', Icon: Zap },
  { key: 'gas', label: 'Gas Line', category: 'Utility Supply', Icon: Flame },
  { key: 'intercom', label: 'Intercom', category: 'Direct Comms', Icon: PhoneCall },
  { key: 'cctv', label: 'CCTV Surveillance', category: 'Video Monitoring', Icon: Video },
  { key: 'fire-safety', label: 'Fire Safety', category: 'Life Protection', Icon: Siren },
  { key: 'rooftop-garden', label: 'Rooftop Garden', category: 'Green Sanctuary', Icon: Trees },
  { key: 'parking', label: 'Car Parking', category: 'Dedicated Bay', Icon: Car },
  { key: 'gym', label: 'Fitness & Gym', category: 'Wellness Studio', Icon: Dumbbell },
  { key: 'pool', label: 'Swimming Pool', category: 'Aquatic Leisure', Icon: Waves },
  { key: 'community-hall', label: 'Community Hall', category: 'Private Gatherings', Icon: Users },
  { key: 'prayer-room', label: 'Prayer Room', category: 'Quiet Reflection', Icon: Landmark },
  { key: 'playground', label: 'Kids Play Zone', category: 'Family Recreation', Icon: Smile },
  { key: 'wifi', label: 'Fiber Internet', category: 'Connectivity', Icon: Wifi },
  { key: 'solar', label: 'Solar Power', category: 'Clean Energy', Icon: Sun },
  { key: 'water-filter', label: 'Water Filtration', category: 'Pure Supply', Icon: Droplets },
  { key: 'ev-charging', label: 'EV Charging', category: 'Electric Mobility', Icon: BatteryCharging },
  { key: 'concierge', label: 'Reception Lobby', category: 'Concierge Entry', Icon: KeyRound },
  { key: 'balcony', label: 'Cross Ventilation', category: 'Natural Airflow', Icon: Wind },
  { key: 'air-conditioning', label: 'Climate Control', category: 'Thermal Comfort', Icon: Snowflake },
  { key: 'sparkles', label: 'Signature Feature', category: 'Curated Detail', Icon: Sparkles },
];

const ICON_MAP: Record<AmenityIconKey, AmenityIconMeta> = Object.fromEntries(
  AMENITY_ICON_CATALOG.map((item) => [item.key, item])
) as Record<AmenityIconKey, AmenityIconMeta>;

export const COMMON_AMENITY_PRESETS: AmenityItem[] = [
  { label: 'লিফট', icon: 'elevator', detail: 'High-speed passenger lift' },
  { label: '২৪/৭ নিরাপত্তা', icon: 'security', detail: 'Guarded entry & patrol' },
  { label: 'জেনারেটর', icon: 'generator', detail: 'Full backup power' },
  { label: 'গ্যাস লাইন', icon: 'gas', detail: 'Dedicated kitchen supply' },
  { label: 'ইন্টারকম', icon: 'intercom', detail: 'Gate-to-residence line' },
  { label: 'সিসিটিভি', icon: 'cctv', detail: '24-hour camera coverage' },
  { label: 'ফায়ার সেফটি', icon: 'fire-safety', detail: 'Detection & extinguishers' },
  { label: 'ছাদ বাগান', icon: 'rooftop-garden', detail: 'Landscaped roof terrace' },
  { label: 'পার্কিং', icon: 'parking', detail: 'Reserved ground bay' },
  { label: 'জিমনেসিয়াম', icon: 'gym', detail: 'Residents fitness suite' },
  { label: 'সুইমিং পুল', icon: 'pool', detail: 'Temperature-controlled pool' },
  { label: 'কমিউনিটি হল', icon: 'community-hall', detail: 'Event & lounge space' },
  { label: 'নামাজ ঘর', icon: 'prayer-room', detail: 'Dedicated prayer space' },
  { label: 'শিশুদের খেলার জায়গা', icon: 'playground', detail: 'Safe outdoor play zone' },
  { label: 'সোলার প্যানেল', icon: 'solar', detail: 'Renewable roof grid' },
];

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

/** Normalizes any string or partial AmenityItem into a complete AmenityItem. */
export function normalizeAmenity(raw: unknown): AmenityItem | null {
  if (typeof raw === 'string') {
    const label = raw.trim();
    if (!label) return null;
    const icon = inferAmenityIcon(label);
    return { label, icon };
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const label = typeof obj.label === 'string' ? obj.label.trim() : '';
    if (!label && typeof obj.icon !== 'string') return null;
    const rawIcon = typeof obj.icon === 'string' ? (obj.icon as AmenityIconKey) : undefined;
    const icon: AmenityIconKey = rawIcon && ICON_MAP[rawIcon] ? rawIcon : inferAmenityIcon(label);
    const detail = typeof obj.detail === 'string' && obj.detail.trim() ? obj.detail.trim() : undefined;
    return { label, icon, ...(detail ? { detail } : {}) };
  }
  return null;
}

export function normalizeAmenities(list: unknown): AmenityItem[] {
  if (!Array.isArray(list)) return [];
  const out: AmenityItem[] = [];
  for (const item of list) {
    if (item && typeof item === 'object' && 'label' in item) {
      const obj = item as { label?: string; icon?: AmenityIconKey; detail?: string };
      const label = typeof obj.label === 'string' ? obj.label : '';
      const icon = obj.icon && ICON_MAP[obj.icon] ? obj.icon : inferAmenityIcon(label);
      out.push({
        label,
        icon,
        ...(obj.detail ? { detail: obj.detail } : {}),
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
