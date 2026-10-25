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
  titleBn: 'বারাকাহ রেসিডেন্স',
  taglineBn: 'যেখানে আকাশ ছোঁয়া স্বপ্ন, মাটিতে রূপ পায়।',
  summary:
    'A south-east facing, three-bedroom residence in a ten-storey building in Bashundhara R/A. Three balconies, a bathroom for every bedroom, and a quiet lane set back from the main road. Ready to move.',

  location: {
    areaBn: 'বসুন্ধরা, ঢাকা',
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
    {
      key: 'quiet',
      label: 'Set back from the road',
      labelBn: 'নিরিবিলি অবস্থান',
      value: 'Inner lane',
      why: 'Off the main road, so mornings are quiet but the main road is a short walk away.',
      tier: 'defining',
    },
    {
      key: 'ceiling',
      label: 'Ceiling Height',
      labelBn: 'সিলিং উচ্চতা',
      value: '10 ft',
      why: 'Higher ceilings let warm air rise away from you, so rooms feel larger and cooler.',
      tier: 'reference',
    },
    {
      key: 'flooring',
      label: 'Flooring',
      value: 'Homogeneous tiles · wood in bedrooms',
      tier: 'reference',
    },
    {
      key: 'kitchen',
      label: 'Kitchen',
      value: 'Marble counter, gas line, exhaust',
      tier: 'reference',
    },
  ],
  units: [],

  media: {
    hero: { url: `${B}/front-view.jpg`, caption: 'Front elevation' },
    gallery: [
      { url: `${B}/drawing.jpg`, room: 'Living', caption: 'Drawing room', captionBn: 'ড্রয়িং রুম' },
      { url: `${B}/dining.jpg`, room: 'Dining', caption: 'Dining area', captionBn: 'খাবার ঘর' },
      { url: `${B}/bedroom-1.jpg`, room: 'Bedroom', caption: 'Master bedroom', captionBn: 'মাস্টার বেডরুম' },
      { url: `${B}/bedroom-2.jpg`, room: 'Bedroom', caption: 'Secondary suite', captionBn: 'দ্বিতীয় শয়নকক্ষ' },
      { url: `${B}/kitchen.jpg`, room: 'Kitchen', caption: 'Modern kitchen', captionBn: 'রান্নাঘর' },
      { url: `${B}/bath.jpg`, room: 'Bath', caption: 'Spa bathroom', captionBn: 'স্নানঘর' },
      { url: `${B}/balcony.jpg`, room: 'Balcony', caption: 'Balcony vista', captionBn: 'ব্যালকনি থেকে দৃশ্য' },
      { url: `${B}/side-view.jpg`, room: 'Exterior', caption: 'Side elevation', captionBn: 'পাশের দৃশ্য' },
      { url: `${B}/main-gate.jpg`, room: 'Exterior', caption: 'Main gate', captionBn: 'প্রধান ফটক' },
    ],
    floorPlans: [{ url: `${B}/floor-plan.jpg`, caption: 'Typical floor · 3 bed / 3 bath' }],
  },

  chapters: [
    {
      kicker: 'The Arrival',
      titleBn: 'প্রথম দৃষ্টিতেই মুগ্ধতা',
      titleEn: 'A Grand Welcome',
      body: 'শহরের ব্যস্ত রাস্তা থেকে একটু ভেতরে, যেখানে নীরবতা আপনাকে অভ্যর্থনা জানায়। শেভরন প্যাটার্নের কাঠের গেট পেরিয়ে আপনি প্রবেশ করেন এক ভিন্ন জগতে — যেখানে প্রতিটি বিবরণ বলে, এই বাড়ি সাধারণ নয়।',
      imageUrl: `${B}/main-gate.jpg`,
      layout: 'right',
    },
    {
      kicker: 'The Form',
      titleBn: 'আকাশছোঁয়া স্থাপত্য',
      titleEn: 'Sculpted Skyward',
      body: 'দশ তলা উচ্চতায় কংক্রিট আর কাচের ছন্দবদ্ধ বিন্যাস। প্রতিটি ব্যালকনি, প্রতিটি কোণ — যেন একটি ভাস্কর্য, যা আলো আর বায়ুকে আমন্ত্রণ জানায় ভেতরে প্রবেশ করতে।',
      imageUrl: `${B}/side-view.jpg`,
      layout: 'left',
    },
    {
      kicker: 'The Perspective',
      titleBn: 'উপর থেকে দেখা স্বপ্ন',
      titleEn: 'Looking Up',
      body: 'নিচ থেকে উপরে তাকালে দেখা যায় জ্যামিতিক ছন্দের এক অপূর্ব খেলা। প্রতিটি তলা যেন পরের তলার জন্য একটি নতুন ক্যানভাস তৈরি করে, আকাশের দিকে এগিয়ে যায় দৃঢ়ভাবে।',
      imageUrl: `${B}/bottom-top.jpg`,
      layout: 'full',
    },
    {
      kicker: 'The Living',
      titleBn: 'যেখানে গল্প শুরু হয়',
      titleEn: 'Where Stories Begin',
      body: 'ড্রয়িং রুমে পা রাখলেই বুঝবেন — এখানে প্রতিটি বিবরণ সুচিন্তিত। গভীর নীল সোফা, উষ্ণ আলোর বিন্যাস, এবং ক্লাসিক ওয়াল প্যানেলিং মিলে তৈরি করেছে এমন এক পরিবেশ, যেখানে সময় থেমে যেতে চায়।',
      imageUrl: `${B}/drawing.jpg`,
      layout: 'right',
    },
    {
      kicker: 'The Retreat',
      titleBn: 'নিজের জন্য, একটু শান্তি',
      titleEn: 'Your Private Sanctuary',
      body: 'মাস্টার বেডরুম হলো আপনার ব্যক্তিগত আশ্রয়। প্রাকৃতিক আলো, সবুজের ছোঁয়া, এবং মিনিমালিস্ট ডিজাইন — সবকিছু মিলে তৈরি হয়েছে এমন এক জায়গা, যেখানে প্রতিটি সকাল শুরু হয় প্রশান্তিতে।',
      imageUrl: `${B}/bedroom-1.jpg`,
      layout: 'left',
    },
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

  amenities: ['লিফট', '২৪/৭ নিরাপত্তা', 'জেনারেটর', 'গ্যাস লাইন', 'ইন্টারকম', 'সিসিটিভি', 'ফায়ার সেফটি', 'ছাদ বাগান'],

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

  contact: { phone: '+880 1XXX-XXXXXX', whatsapp: '', email: 'info@aura.com.bd' },
  seo: {
    title: 'The Barakah Residence · 3 Bed South-East Apartment, Bashundhara | AURA',
    description: 'A 1,850 sq ft, south-east facing 3-bed apartment on the 7th floor in Bashundhara R/A. Ready to move. Arrange a private visit with AURA.',
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
  titleBn: 'নীরব হাইটস',
  taglineBn: 'শহরের মাঝে, কোলাহলের বাইরে।',
  summary:
    'A demo multi-unit project showing how the building stack works. Twenty-two homes across eleven floors, two per floor: a south-facing 3-bed "A" and an east-facing "B". Replace with real data or delete.',
  location: { areaBn: 'উত্তরা, ঢাকা', area: 'Uttara', city: 'Dhaka', address: 'Sector 13, Uttara, Dhaka' },
  price: { amount: 0, negotiable: false },
  core: { totalFloors: 12, parking: 1, handover: '2027-12' },
  facts: [],
  units: demoUnits(),
  chapters: [],
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

export const SEED_LISTINGS: Listing[] = [BARAKAH, DEMO_PROJECT];
