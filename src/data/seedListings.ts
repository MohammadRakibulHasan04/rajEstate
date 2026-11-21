import { Listing, Unit } from '../types/listing';

/* ------------------------------------------------------------------
   SEED LISTINGS
   1. The Barakah Residence: migrated from the old hardcoded
      ProjectOnePage. It is published and also used as a local fallback
      so /property/the-barakah-residence renders before Firestore is
      seeded.
   2. A draft demo project used to show the multi-unit layout. Edit or
      delete it from /manage.
------------------------------------------------------------------- */

const B = '/listings/barakah';
const NOW = '2026-10-24T00:00:00.000Z';

export const BARAKAH: Listing = {
  id: 'seed-barakah',
  slug: 'the-barakah-residence',
  kind: 'single',
  category: 'apartment',
  publish: 'published',
  construction: 'ready',
  featured: true,

  title: 'The Barakah Residence',
  summary:
    'বসুন্ধরা আবাসিক এলাকার একটি শান্ত গলিতে দশতলা ভবনের সাত তলায় দক্ষিণ-পূর্বমুখী তিন বেডরুমের অ্যাপার্টমেন্ট। প্রতিটি বেডরুমের সাথে সংযুক্ত বাথরুম, তিনটি বারান্দা এবং সারাদিন প্রাকৃতিক আলো-বাতাসের সুব্যবস্থা রয়েছে। মূল সড়ক থেকে কিছুটা ভেতরে হওয়ায় পরিবেশ নিরিবিলি, অথচ স্কুল, হাসপাতাল ও বাজার কয়েক মিনিটের দূরত্বে। ফ্ল্যাটটি সম্পূর্ণ প্রস্তুত, এখনই বসবাস শুরু করা যাবে।',

  location: {
    area: 'Bashundhara R/A',
    city: 'Dhaka',
    address: 'Bashundhara Residential Area, Dhaka 1229',
    mapEmbedUrl: 'https://www.google.com/maps?q=Bashundhara+Residential+Area+Dhaka&output=embed',
  },

  price: { amount: 28500000, negotiable: true },

  core: {
    sizeSqft: 1850,
    beds: 3,
    baths: 3,
    balconies: 3,
    parking: 1,
    floor: 7,
    totalFloors: 10,
    facing: 'South-East',
    handover: '2025-06',
  },

  facts: [
    { key: 'ceiling', label: 'Ceiling Height', value: '10 ft', tier: 'reference' },
    { key: 'flooring', label: 'Flooring', value: 'Homogeneous tiles, wooden floor in bedrooms', tier: 'reference' },
    { key: 'kitchen', label: 'Kitchen', value: 'Marble counter, gas line, exhaust', tier: 'reference' },
  ],
  units: [],

  media: {
    hero: { url: `${B}/front-view.jpg`, caption: 'Front elevation' },
    gallery: [
      { url: `${B}/drawing.jpg`, room: 'Living', caption: 'Drawing room' },
      { url: `${B}/dining.jpg`, room: 'Dining', caption: 'Dining area' },
      { url: `${B}/bedroom-1.jpg`, room: 'Bedroom', caption: 'Master bedroom' },
      { url: `${B}/bedroom-2.jpg`, room: 'Bedroom', caption: 'Second bedroom' },
      { url: `${B}/kitchen.jpg`, room: 'Kitchen', caption: 'Kitchen' },
      { url: `${B}/bath.jpg`, room: 'Bath', caption: 'Bathroom' },
      { url: `${B}/balcony.jpg`, room: 'Balcony', caption: 'Balcony view' },
      { url: `${B}/side-view.jpg`, room: 'Exterior', caption: 'Side elevation' },
      { url: `${B}/bottom-top.jpg`, room: 'Exterior', caption: 'Facade' },
      { url: `${B}/main-gate.jpg`, room: 'Exterior', caption: 'Main gate' },
    ],
    floorPlans: [{ url: `${B}/floor-plan.jpg`, caption: 'Typical floor · 3 bed / 3 bath' }],
  },

  sections: [
    { id: 'specifications', type: 'specifications', enabled: true },
    { id: 'floorPlans', type: 'floorPlans', enabled: true },
    { id: 'amenities', type: 'amenities', enabled: true },
    { id: 'location', type: 'location', enabled: true },
    { id: 'legal', type: 'legal', enabled: true },
    { id: 'progress', type: 'progress', enabled: false },
    { id: 'video', type: 'video', enabled: false },
  ],

  // Approximate travel times; verify and edit from /manage.
  nearby: [
    { name: 'Neighbourhood mosque', type: 'mosque', minutes: 3, mode: 'walk' },
    { name: 'Evercare Hospital Dhaka', type: 'hospital', minutes: 8, mode: 'drive' },
    { name: 'North South University', type: 'school', minutes: 8, mode: 'drive' },
    { name: 'Independent University, Bangladesh', type: 'school', minutes: 7, mode: 'drive' },
    { name: 'Jamuna Future Park', type: 'market', minutes: 12, mode: 'drive' },
    { name: 'Kuril Flyover / Airport Road', type: 'transit', minutes: 14, mode: 'drive' },
  ],

  amenities: [
    { label: 'Lift', icon: 'elevator', detail: 'High-speed passenger lift' },
    { label: '24/7 Security', icon: 'security', detail: 'Guarded entry & patrol' },
    { label: 'Generator Backup', icon: 'generator', detail: 'Full backup power' },
    { label: 'Gas Line', icon: 'gas', detail: 'Dedicated kitchen supply' },
    { label: 'Intercom', icon: 'intercom', detail: 'Gate-to-residence line' },
    { label: 'CCTV', icon: 'cctv', detail: '24-hour camera coverage' },
    { label: 'Fire Safety', icon: 'fire-safety', detail: 'Detection & extinguishers' },
    { label: 'Rooftop Garden', icon: 'rooftop-garden', detail: 'Landscaped roof terrace' },
  ],

  trust: {
    developer: 'Total Barakah Housing',
    rajukApproval: '',
    landTitle: '',
    milestones: [
      { label: 'Design approval', date: '2021-03', done: true },
      { label: 'Piling & foundation', date: '2021-11', done: true },
      { label: 'Structure complete', date: '2023-08', done: true },
      { label: 'Finishing', date: '2024-12', done: true },
      { label: 'Handover', date: '2025-06', done: true },
    ],
  },

  contact: {
    name: 'Sales Desk',
    designation: 'Property Advisor',
    company: 'Jonopod Properties',
    phone: '+880 1XXX-XXXXXX',
    email: 'info@jonopodproperties.com',
    hours: 'Sat–Thu, 10:00 AM – 7:00 PM',
  },
  seo: {
    title: 'The Barakah Residence · 3 Bed South-East Apartment, Bashundhara | Jonopod Properties',
    description: 'A 1,850 sq ft, south-east facing 3-bed apartment on the 7th floor in Bashundhara R/A. Ready to move. Arrange a private visit with Jonopod Properties.',
  },
  createdAt: NOW,
  updatedAt: NOW,
  createdBy: 'seed',
};

function demoUnits(): Unit[] {
  const units: Unit[] = [];
  const statuses: Unit['status'][] = ['sold', 'sold', 'booked', 'available'];
  for (let floor = 2; floor <= 12; floor++) {
    (['A', 'B'] as const).forEach((side, i) => {
      const size = side === 'A' ? 1650 : 1380;
      const status = floor < 5 ? 'sold' : statuses[(floor + i) % statuses.length];
      units.push({
        id: `u-${floor}${side}`,
        code: `${floor}${side}`,
        floor,
        sizeSqft: size,
        beds: side === 'A' ? 3 : 3,
        baths: side === 'A' ? 3 : 2,
        balconies: side === 'A' ? 3 : 2,
        facing: side === 'A' ? 'South' : 'East',
        price: Math.round((size * (11800 + floor * 180)) / 10000) * 10000,
        status,
      });
    });
  }
  return units;
}

export const DEMO_PROJECT: Listing = {
  ...BARAKAH,
  id: 'seed-demo-project',
  slug: 'nirob-heights-demo',
  kind: 'project',
  publish: 'draft',
  construction: 'ongoing',
  featured: false,
  title: 'Nirob Heights (Demo Project)',
  summary:
    'বিল্ডিং স্ট্যাক কীভাবে কাজ করে তা দেখানোর জন্য একটি ডেমো প্রজেক্ট। এগারো তলা জুড়ে মোট বাইশটি ইউনিট, প্রতি তলায় দুটি: দক্ষিণমুখী তিন বেডরুমের "A" এবং পূর্বমুখী "B"। আসল তথ্য দিয়ে হালনাগাদ করুন অথবা মুছে ফেলুন।',
  location: { area: 'Uttara', city: 'Dhaka', address: 'Sector 13, Uttara, Dhaka' },
  price: { amount: 0, negotiable: false },
  core: { totalFloors: 12, parking: 1, handover: '2027-12' },
  facts: [],
  units: demoUnits(),
  sections: [
    { id: 'floorPlans', type: 'floorPlans', enabled: true },
    { id: 'amenities', type: 'amenities', enabled: true },
    { id: 'location', type: 'location', enabled: true },
    { id: 'progress', type: 'progress', enabled: true },
    { id: 'legal', type: 'legal', enabled: true },
    {
      id: 'custom-payment-plan',
      type: 'custom',
      enabled: true,
      title: 'Payment Plan',
      body: 'বুকিংয়ের সময় মোট মূল্যের ২০% ডাউন পেমেন্ট। বাকি অর্থ নির্মাণকাজের অগ্রগতির সাথে ২৪টি মাসিক কিস্তিতে পরিশোধযোগ্য। এককালীন পরিশোধে বিশেষ ছাড় প্রযোজ্য।',
    },
    { id: 'specifications', type: 'specifications', enabled: false },
    { id: 'video', type: 'video', enabled: false },
  ],
  trust: {
    developer: 'Demo Developer Ltd.',
    rajukApproval: '',
    milestones: [
      { label: 'Design approval', date: '2025-01', done: true },
      { label: 'Piling & foundation', date: '2025-09', done: true },
      { label: 'Structure', date: '2026-12', done: false },
      { label: 'Finishing', date: '2027-08', done: false },
      { label: 'Handover', date: '2027-12', done: false },
    ],
  },
  seo: {},
};

/**
 * One apartment of the demo project with its own detail page. Size, rooms,
 * floor, facing, price and availability come from unit 7A of the project;
 * location, developer, contact and amenities are inherited because they
 * are left empty here.
 */
export const DEMO_UNIT_7A: Listing = {
  id: 'seed-demo-unit-7a',
  slug: 'nirob-heights-demo-7a',
  kind: 'single',
  parent: { id: DEMO_PROJECT.id, unitId: 'u-7A' },
  category: 'apartment',
  publish: 'draft',
  construction: DEMO_PROJECT.construction,
  featured: false,
  title: 'Nirob Heights · Unit 7A (Demo)',
  summary:
    'নীরব হাইটসের ৭A ইউনিটের সাথে যুক্ত একটি ডেমো অ্যাপার্টমেন্ট পেজ। এর আয়তন, মূল্য ও প্রাপ্যতা প্রজেক্টের ইউনিট তালিকা থেকে আসে, তাই ইউনিট হালনাগাদ করলে এই পেজও স্বয়ংক্রিয়ভাবে হালনাগাদ হয়।',
  location: { area: '', city: '', address: '' },
  price: { amount: 0, negotiable: false },
  core: {},
  facts: [],
  units: [],
  media: {
    hero: { url: '' },
    gallery: BARAKAH.media.gallery.slice(0, 4),
    floorPlans: [],
  },
  nearby: [],
  amenities: [],
  sections: [
    { id: 'floorPlans', type: 'floorPlans', enabled: true },
    { id: 'amenities', type: 'amenities', enabled: true },
    { id: 'location', type: 'location', enabled: true },
    { id: 'legal', type: 'legal', enabled: true },
  ],
  trust: { developer: '', milestones: [] },
  contact: { phone: '' },
  seo: {},
  createdAt: NOW,
  updatedAt: NOW,
  createdBy: 'seed',
};

export const SEED_LISTINGS: Listing[] = [BARAKAH, DEMO_PROJECT, DEMO_UNIT_7A];
