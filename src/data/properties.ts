import { Property } from '../types/property';

// Helper to create stunning architectural SVG representations
function createArchSvg(title: string, sub: string, type: 'blueprint' | 'exterior_dusk' | 'interior_minimal' | 'cantilever' | 'coastal'): string {
  const blueprintSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="100%" height="100%">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.15)" stroke-width="1"/>
        </pattern>
        <pattern id="dotGrid" width="200" height="200" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="1.5" fill="rgba(56, 189, 248, 0.4)"/>
        </pattern>
        <linearGradient id="blueprintGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#07192f"/>
          <stop offset="100%" stop-color="#020b17"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#blueprintGrad)"/>
      <rect width="100%" height="100%" fill="url(#grid)"/>
      <rect width="100%" height="100%" fill="url(#dotGrid)"/>
      
      <!-- Architectural Elevations & Linework -->
      <g stroke="#38bdf8" stroke-width="1.8" fill="none" opacity="0.85">
        <line x1="120" y1="680" x2="1480" y2="680" stroke-width="3" stroke="#0284c7"/>
        <line x1="260" y1="680" x2="260" y2="760" stroke-dasharray="6,4"/>
        <line x1="560" y1="680" x2="560" y2="760" stroke-dasharray="6,4"/>
        <line x1="960" y1="680" x2="960" y2="760" stroke-dasharray="6,4"/>
        <line x1="1300" y1="680" x2="1300" y2="760" stroke-dasharray="6,4"/>
        
        <rect x="240" y="440" width="1080" height="240" stroke="#7dd3fc" stroke-width="2.5" fill="rgba(14, 165, 233, 0.04)"/>
        <polygon points="180,240 1140,240 1140,440 180,440" stroke="#38bdf8" stroke-width="3" fill="rgba(56, 189, 248, 0.06)"/>
        <polygon points="420,130 980,130 980,240 420,240" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8,4"/>
        
        <line x1="280" y1="240" x2="280" y2="440" stroke-width="1.2"/>
        <line x1="420" y1="240" x2="420" y2="440" stroke-width="1.2"/>
        <line x1="560" y1="240" x2="560" y2="440" stroke-width="1.2"/>
        <line x1="700" y1="240" x2="700" y2="440" stroke-width="1.2"/>
        <line x1="840" y1="240" x2="840" y2="440" stroke-width="1.2"/>
        <line x1="980" y1="240" x2="980" y2="440" stroke-width="1.2"/>
        
        <line x1="180" y1="190" x2="1140" y2="190" stroke="#93c5fd" stroke-width="1"/>
        <circle cx="180" cy="190" r="3" fill="#93c5fd"/>
        <circle cx="1140" cy="190" r="3" fill="#93c5fd"/>
        <text x="660" y="180" font-family="monospace" font-size="14" fill="#bae6fd" text-anchor="middle">SPAN: 38,400 mm [POST-TENSIONED]</text>
        
        <line x1="120" y1="240" x2="120" y2="680" stroke="#93c5fd" stroke-width="1"/>
        <text x="100" y="470" font-family="monospace" font-size="13" fill="#bae6fd" text-anchor="middle" transform="rotate(-90 100 470)">H: 14,200 mm FINISHED ELEVATION</text>
      </g>
      
      <g font-family="monospace" fill="#7dd3fc" font-size="12">
        <text x="140" y="100">SCALE: 1:100</text>
        <text x="140" y="125">DATUM: EL +142.50m AMSL</text>
        <text x="140" y="150">DISCIPLINE: STRUCTURAL / ARCHITECTURAL</text>
      </g>

      <rect x="1100" y="700" width="380" height="150" fill="rgba(7, 25, 47, 0.9)" stroke="#0284c7" stroke-width="1.5"/>
      <text x="1120" y="735" font-family="serif" font-size="20" fill="#f0f9ff">${title.toUpperCase()}</text>
      <text x="1120" y="765" font-family="sans-serif" font-size="13" fill="#7dd3fc">${sub}</text>
      <text x="1120" y="795" font-family="monospace" font-size="11" fill="#38bdf8">REF: AURA-ARCH-CAD-992 // APPROVED</text>
      <text x="1120" y="820" font-family="monospace" font-size="10" fill="#94a3b8">AUTHORIZED ARCHITECTURAL DRAWING</text>
    </svg>
  `;

  const duskExteriorSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="100%" height="100%">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#080b14"/>
          <stop offset="45%" stop-color="#141824"/>
          <stop offset="75%" stop-color="#2a222a"/>
          <stop offset="90%" stop-color="#54332d"/>
          <stop offset="100%" stop-color="#1a141c"/>
        </linearGradient>
        <linearGradient id="poolGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#081b29"/>
          <stop offset="50%" stop-color="#0e3447"/>
          <stop offset="100%" stop-color="#06121a"/>
        </linearGradient>
        <radialGradient id="interiorGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fed7aa" stop-opacity="0.95"/>
          <stop offset="40%" stop-color="#fb923c" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#7c2d12" stop-opacity="0"/>
        </radialGradient>
        <filter id="softBlur">
          <feGaussianBlur stdDeviation="8"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#skyGrad)"/>
      
      <polygon points="0,520 180,480 340,510 580,450 780,490 1020,440 1280,495 1600,430 1600,600 0,600" fill="#0d1017"/>
      <polygon points="0,580 1600,560 1600,900 0,900" fill="#090c12"/>
      <polygon points="220,620 1420,620 1380,680 200,680" fill="#181d27" stroke="#2a3242" stroke-width="1"/>
      <polygon points="260,310 1180,310 1180,480 260,480" fill="#111620" stroke="#232b3b" stroke-width="1"/>
      <polygon points="980,270 1340,270 1340,620 980,620" fill="#24211e" stroke="#3b3732" stroke-width="1"/>
      <rect x="320" y="480" width="660" height="140" fill="#0c1824" stroke="#1f2c3d" stroke-width="1"/>
      
      <rect x="340" y="330" width="360" height="130" fill="url(#interiorGlow)" opacity="0.8"/>
      <rect x="740" y="330" width="400" height="130" fill="url(#interiorGlow)" opacity="0.65"/>
      <rect x="340" y="495" width="620" height="110" fill="url(#interiorGlow)" opacity="0.9"/>
      
      <g stroke="#1b2330" stroke-width="2">
        <line x1="460" y1="310" x2="460" y2="480"/>
        <line x1="580" y1="310" x2="580" y2="480"/>
        <line x1="700" y1="310" x2="700" y2="480"/>
        <line x1="820" y1="310" x2="820" y2="480"/>
        <line x1="940" y1="310" x2="940" y2="480"/>
        <line x1="1060" y1="310" x2="1060" y2="480"/>
      </g>

      <polygon points="320,640 1280,640 1360,780 200,780" fill="url(#poolGrad)"/>
      <line x1="320" y1="640" x2="1280" y2="640" stroke="#38bdf8" stroke-width="2" opacity="0.4"/>
      
      <ellipse cx="640" cy="690" rx="280" ry="16" fill="#f59e0b" opacity="0.18" filter="url(#softBlur)"/>
      <ellipse cx="980" cy="710" rx="160" ry="12" fill="#38bdf8" opacity="0.15" filter="url(#softBlur)"/>

      <path d="M 1320,620 Q 1335,560 1300,520 Q 1340,490 1370,510 Q 1390,470 1440,490 Q 1460,540 1410,570 Q 1380,590 1340,620 Z" fill="#13171f"/>

      <circle cx="360" cy="630" r="3" fill="#fde047"/>
      <circle cx="580" cy="630" r="3" fill="#fde047"/>
      <circle cx="800" cy="630" r="3" fill="#fde047"/>
      <circle cx="1020" cy="630" r="3" fill="#fde047"/>
      <circle cx="1240" cy="630" r="3" fill="#fde047"/>

      <g transform="translate(100, 780)">
        <text font-family="serif" font-size="28" fill="#f8fafc" letter-spacing="3">${title.toUpperCase()}</text>
        <text y="28" font-family="sans-serif" font-size="14" fill="#94a3b8" letter-spacing="1">${sub}</text>
      </g>
    </svg>
  `;

  const interiorSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="100%" height="100%">
      <defs>
        <linearGradient id="twilightCity" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#060913"/>
          <stop offset="50%" stop-color="#141c2e"/>
          <stop offset="100%" stop-color="#3b2d35"/>
        </linearGradient>
        <linearGradient id="travertine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#26231e"/>
          <stop offset="40%" stop-color="#332e27"/>
          <stop offset="70%" stop-color="#2a2620"/>
          <stop offset="100%" stop-color="#1c1915"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="#0a0c12"/>
      
      <polygon points="120,60 1480,60 1480,680 120,680" fill="url(#twilightCity)"/>
      <g fill="#0e1320">
        <rect x="220" y="440" width="90" height="240"/>
        <rect x="340" y="380" width="110" height="300"/>
        <rect x="480" y="460" width="80" height="220"/>
        <rect x="620" y="340" width="140" height="340"/>
        <rect x="800" y="420" width="100" height="260"/>
        <rect x="940" y="360" width="120" height="320"/>
        <rect x="1100" y="450" width="90" height="230"/>
        <rect x="1220" y="390" width="130" height="290"/>
      </g>
      
      <g fill="#fef08a" opacity="0.6">
        <circle cx="380" cy="420" r="1.5"/><circle cx="410" cy="460" r="1.5"/><circle cx="680" cy="380" r="1.5"/><circle cx="710" cy="420" r="1.5"/>
        <circle cx="990" cy="410" r="1.5"/><circle cx="1020" cy="470" r="1.5"/><circle cx="1260" cy="440" r="1.5"/><circle cx="1300" cy="490" r="1.5"/>
      </g>
      
      <line x1="460" y1="60" x2="460" y2="680" stroke="#161c28" stroke-width="12"/>
      <line x1="800" y1="60" x2="800" y2="680" stroke="#161c28" stroke-width="12"/>
      <line x1="1140" y1="60" x2="1140" y2="680" stroke="#161c28" stroke-width="12"/>

      <polygon points="0,680 1600,680 1600,900 0,900" fill="url(#travertine)"/>
      <line x1="0" y1="680" x2="1600" y2="680" stroke="#3d372e" stroke-width="2"/>

      <rect x="1200" y="140" width="280" height="600" fill="#2d2822" stroke="#4a4237" stroke-width="1"/>
      <rect x="1240" y="520" width="200" height="80" fill="#0d0e12"/>
      <path d="M 1250,580 Q 1280,550 1300,570 Q 1330,545 1360,575 Q 1400,550 1430,580 Z" fill="#f97316" opacity="0.85"/>
      
      <polygon points="360,620 920,620 940,730 330,730" fill="#1b1d24" stroke="#292c36" stroke-width="1"/>
      <polygon points="380,630 630,630 620,700 370,700" fill="#242731"/>
      <polygon points="650,630 900,630 890,700 640,700" fill="#242731"/>
      <polygon points="520,750 820,750 840,820 480,820" fill="#32302d" stroke="#48443e" stroke-width="1"/>

      <polygon points="0,0 1600,0 1600,60 0,60" fill="#12151e"/>
      <line x1="0" y1="60" x2="1600" y2="60" stroke="#fef08a" stroke-width="3" opacity="0.4"/>

      <rect x="80" y="800" width="400" height="60" fill="none"/>
      <text x="80" y="820" font-family="serif" font-size="24" fill="#f1f5f9" letter-spacing="2">${title.toUpperCase()}</text>
      <text x="80" y="845" font-family="sans-serif" font-size="13" fill="#94a3b8">${sub} · GRAND SALON INTERIOR</text>
    </svg>
  `;

  let chosen = duskExteriorSvg;
  if (type === 'blueprint') chosen = blueprintSvg;
  if (type === 'interior_minimal') chosen = interiorSvg;

  return `data:image/svg+xml;utf8,${encodeURIComponent(chosen.trim())}`;
}

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'aura-solstice-residence',
    title: 'The Solstice Pavilion',
    tagline: 'Sculptural post-tensioned cantilever overlooking the Pacific horizon',
    description: 'A benchmark in modern minimalist brutalism, Solstice Pavilion marries razor-thin cantilevered concrete planes with panoramic low-iron acoustic glass panels. Built into the coastal limestone bluff, the residence frames unbroken twilight ocean views with zero-edge reflection channels.',
    propertyType: 'villa',
    price: 28500000,
    currency: 'USD',
    city: 'Malibu',
    state: 'California',
    country: 'United States',
    address: '32840 Pacific Coast Highway',
    bedrooms: 6,
    bathrooms: 8,
    sqft: 12400,
    yearBuilt: 2025,
    architect: 'Kengo Kuma & Associates / AURA Studio',
    structuralEngineer: 'Arup Façade Engineering',
    status: 'available',
    featured: true,
    heroImage: createArchSvg('Solstice Pavilion', 'Malibu Bluff, California', 'cantilever'),
    galleryImages: [
      {
        url: createArchSvg('Solstice Pavilion', 'Dusk Exterior & Reflection Pool', 'exterior_dusk'),
        caption: 'South-facing elevation during twilight with illuminated infinity basin',
        category: 'exterior',
      },
      {
        url: createArchSvg('Solstice Pavilion', 'Double-Height Travertine Salon', 'interior_minimal'),
        caption: '18-foot travertine clad living pavilion with panoramic glazing',
        category: 'interior',
      },
      {
        url: createArchSvg('Solstice Pavilion', 'Master Structural Blueprint Elevation', 'blueprint'),
        caption: 'Technical structural section displaying 12-meter unpropped cantilever',
        category: 'detail',
      },
    ],
    floorPlans: [
      {
        name: 'Lower Horizon Level',
        level: 'Level 1',
        areaSqFt: 5800,
        rooms: ['Grand Salon', 'Chef Galley & Scullery', 'Wine Gallery', 'Reflecting Terrace'],
        dimensions: '64m x 22m',
      },
      {
        name: 'Upper Cantilever Suite',
        level: 'Level 2',
        areaSqFt: 4600,
        rooms: ['Primary Master Wing', 'Dual Dressing Suites', 'Floating Study', 'Zen Garden'],
        dimensions: '48m x 18m',
      },
      {
        name: 'Wellness & Subterranean Gallery',
        level: 'Basement',
        areaSqFt: 2000,
        rooms: ['Hammam & Sauna', 'Private Screening Room', '4-Vehicle Collector Vault'],
        dimensions: '30m x 16m',
      },
    ],
    tourRooms: [
      {
        id: 'salon',
        name: 'Grand Horizon Salon',
        type: 'salon',
        description: 'Double-height volume framing the Pacific Ocean through 3.8m acoustic sliding glass doors.',
        cameraPosition: [0, 1.6, 4],
        cameraTarget: [0, 1.2, 0],
        hotspots: [
          {
            title: 'Vein-Cut Travertine Wall',
            description: 'Custom quarried Roman travertine with continuous book-matched grain pattern.',
            position: [-2.5, 1.5, 0],
          },
          {
            title: 'Low-Iron Acoustic Glass',
            description: 'Triple-pane solar-optimized glazing with STC 48 sound reduction rating.',
            position: [0, 1.8, -3.5],
          },
          {
            title: 'Recessed Brass Reveal Base',
            description: 'Flush shadow line architectural joinery with integrated linear lighting.',
            position: [2.2, 0.4, 1.0],
          },
        ],
      },
      {
        id: 'terrace',
        name: 'Infinity Pool & Cantilever Terrace',
        type: 'terrace',
        description: 'Post-tensioned 14m deck floating above coastal bluffs with seamless perimeter glass balustrades.',
        cameraPosition: [2, 1.5, 3],
        cameraTarget: [-1, 0.8, -2],
        hotspots: [
          {
            title: 'Zero-Edge Reflection Rim',
            description: 'Basalt stone perimeter overflow edge mirroring sky and ocean currents.',
            position: [0, 0.2, -1.5],
          },
          {
            title: 'Teak Cantilever Planks',
            description: 'Sustainably harvested aged marine teak with concealed stainless fixings.',
            position: [1.8, 0.1, 0.5],
          },
        ],
      },
      {
        id: 'master',
        name: 'Primary Penthouse Suite',
        type: 'master_suite',
        description: 'Private 1,800 sq ft sanctuary with Japanese hinoki wood soaking bath and private balcony.',
        cameraPosition: [-1, 1.5, 3],
        cameraTarget: [0, 1.3, -1],
        hotspots: [
          {
            title: 'Hinoki Soaking Vessel',
            description: 'Hand-joined Japanese cypress tub with aromatherapy water recirculation.',
            position: [-1.8, 0.6, -1.2],
          },
        ],
      },
    ],
    architecturalHighlights: [
      '38-meter unpropped cantilevered upper volume',
      'Geothermal climate regulation with radiant stone heating',
      'Museum-grade Lutron Homeworks QSX lighting automation',
      'Motorized Schuco panoramic minimalist sliding doors',
      'Net-zero energy certification with integrated micro-inverter solar tile array',
    ],
    materials: ['Roman Travertine', 'Post-Tensioned Concrete', 'Black Zinc Cladding', 'Marine Teak', 'Low-Iron Acoustic Glazing'],
    completionNarrative: {
      blueprintDate: 'Q1 2022',
      groundbreakDate: 'Q4 2022',
      framingDate: 'Q2 2024',
      handoverDate: 'Q3 2025',
    },
  },
  {
    id: 'aura-skyline-tribeca',
    title: 'The Tribeca Penthouse Sky Sanctuary',
    tagline: 'Crown triplex atop a historic cast-iron landmark with private rooftop lap pool',
    description: 'Occupying the uppermost three floors of Franklin Street, this triplex blends historic industrial heritage with pristine bespoke Italian minimalism. Soaring 24-foot ceilings, bronze pivot doors, and a private glass enclosed rooftop terrace command 360-degree views of Manhattan.',
    propertyType: 'penthouse',
    price: 34000000,
    currency: 'USD',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    address: '68 Franklin Street, Penthouse',
    bedrooms: 5,
    bathrooms: 6,
    sqft: 9800,
    yearBuilt: 2024,
    architect: 'David Chipperfield Architects',
    structuralEngineer: 'Silman Structural Partners',
    status: 'available',
    featured: true,
    heroImage: createArchSvg('Tribeca Sky Sanctuary', 'Triplex Penthouse, Manhattan', 'interior_minimal'),
    galleryImages: [
      {
        url: createArchSvg('Tribeca Sky Sanctuary', '24ft Ceilings & Bronze Pivot Windows', 'interior_minimal'),
        caption: 'Double height living volume facing downtown Manhattan skyline',
        category: 'interior',
      },
      {
        url: createArchSvg('Tribeca Sky Sanctuary', 'Rooftop Infinity Lap Pool & Sky Garden', 'exterior_dusk'),
        caption: 'Private rooftop pavilion featuring steel-framed skylight dome',
        category: 'exterior',
      },
      {
        url: createArchSvg('Tribeca Sky Sanctuary', 'Triplex Structural Axonometric Plan', 'blueprint'),
        caption: 'Structural redistribution schematics preserving original cast-iron columns',
        category: 'detail',
      },
    ],
    floorPlans: [
      {
        name: 'Lower Entertaining Gallery',
        level: 'Floor 10',
        areaSqFt: 3800,
        rooms: ['Great Room', 'Boffi Monolithic Kitchen', 'Private Library', 'Staff Quarters'],
        dimensions: '32m x 14m',
      },
      {
        name: 'Private Sleeping Quarters',
        level: 'Floor 11',
        areaSqFt: 3600,
        rooms: ['Primary Suite & Terrace', '3 En-Suite Bedrooms', 'Bespoke Dressing Hall'],
        dimensions: '32m x 14m',
      },
      {
        name: 'Rooftop Oasis & Lap Pool',
        level: 'Floor 12 & Sky Deck',
        areaSqFt: 2400,
        rooms: ['Glass Solarium', 'Stainless Steel Lap Pool', 'Outdoor Kitchen & Fire Hearth'],
        dimensions: '28m x 12m',
      },
    ],
    tourRooms: [
      {
        id: 'salon',
        name: 'Cathedral Great Room',
        type: 'salon',
        description: '24-foot double-height salon framed by original restored cast-iron columns and blackened steel ribbons.',
        cameraPosition: [0, 1.8, 5],
        cameraTarget: [0, 1.5, 0],
        hotspots: [
          {
            title: '1892 Restored Corinthian Column',
            description: 'Historic cast iron sandblasted and preserved with matte structural sealant.',
            position: [-2.8, 2.0, 1.2],
          },
          {
            title: 'Monolithic Calacatta Vagli Island',
            description: 'Single 4-ton block of honed Italian marble with induction cooking surface.',
            position: [2.5, 0.9, -1.0],
          },
        ],
      },
    ],
    architecturalHighlights: [
      'Private high-speed biometric elevator vestibule',
      'Heated 40-foot stainless steel rooftop lap pool',
      'Integrated HEPA-14 medical grade atmospheric purification',
      'Custom acoustic insulation floating floor slab system',
    ],
    materials: ['Cast Iron', 'Calacatta Vagli Marble', 'Blackened Steel', 'Smoked European White Oak', 'Bronze Glazing Systems'],
    completionNarrative: {
      blueprintDate: 'Q2 2021',
      groundbreakDate: 'Q1 2022',
      framingDate: 'Q3 2023',
      handoverDate: 'Q4 2024',
    },
  },
  {
    id: 'aura-villa-bellagio',
    title: 'Villa Monolithica',
    tagline: 'Terraced stone brutalism rising above the azure shores of Lake Como',
    description: 'Chiseled directly from Moltrasio stone, Villa Monolithica commands a dramatic vantage over Lake Como. Featuring an underground boat dock carved into the rock face, tiered olive groves, and cantilevered basalt loggias that blur the line between geology and modern habitation.',
    propertyType: 'estate',
    price: 42000000,
    currency: 'EUR',
    city: 'Lake Como',
    country: 'Italy',
    address: 'Via Vecchia Regina, Moltrasio',
    bedrooms: 7,
    bathrooms: 9,
    sqft: 14500,
    yearBuilt: 2025,
    architect: 'Peter Zumthor + Studio Bellagio',
    structuralEngineer: 'Studio di Ingegneria Como',
    status: 'available',
    featured: true,
    heroImage: createArchSvg('Villa Monolithica', 'Lake Como, Moltrasio', 'coastal'),
    galleryImages: [
      {
        url: createArchSvg('Villa Monolithica', 'Tiered Moltrasio Stone Terraces', 'exterior_dusk'),
        caption: 'Evening perspective showing stone loggias reflecting across Lake Como',
        category: 'exterior',
      },
      {
        url: createArchSvg('Villa Monolithica', 'Subterranean Boathouse & Vault', 'blueprint'),
        caption: 'Architectural cavern cut directly into the granite lake shoreline',
        category: 'detail',
      },
    ],
    floorPlans: [
      {
        name: 'Lake Level & Private Dock',
        level: 'Sub-Level',
        areaSqFt: 3500,
        rooms: ['Double Riva Boat Slip', 'Wine Cave', 'Subterranean Spa & Cold Plunge'],
        dimensions: '40m x 15m',
      },
      {
        name: 'Main Villa Living & Loggias',
        level: 'Level 1',
        areaSqFt: 6200,
        rooms: ['Great Reception Salon', 'Formal Dining', 'Chef Kitchen', 'Terrace Pergola'],
        dimensions: '55m x 18m',
      },
    ],
    tourRooms: [
      {
        id: 'salon',
        name: 'The Lake Loggia',
        type: 'salon',
        description: 'Covered outdoor-indoor stone colonnade overlooking the Bellagio promontory.',
        cameraPosition: [0, 1.5, 4],
        cameraTarget: [0, 1.2, 0],
        hotspots: [
          {
            title: 'Moltrasio Dry-Stacked Masonry',
            description: 'Locally extracted limestone assembled by master Italian stonemasons without visible mortar.',
            position: [-2.0, 1.5, 0],
          },
        ],
      },
    ],
    architecturalHighlights: [
      'Subterranean cavern boat harbor with private Riva yacht hoist',
      'Century-old heritage olive grove and tiered stone terraces',
      'Geothermal lake heat pump system providing 100% renewable thermal control',
      'Custom bronze pivot doors by Secco Sistemi',
    ],
    materials: ['Moltrasio Stone', 'Basaltina Tile', 'Aged Architectural Bronze', 'Solid Chestnut Wood'],
  },
  {
    id: 'aura-alpine-sanctuary',
    title: 'The Aspen Glass Pavilion',
    tagline: 'Precision alpine glass & timber engineering tucked into the White River National Forest',
    description: 'Surrounded by towering aspens and snow-capped peaks, this alpine sanctuary is an ode to thermal glass architecture. Featuring triple-pane argon thermally isolated curtain walls, exposed Douglas fir glue-laminated beams, and an indoor-outdoor heated stone courtyard.',
    propertyType: 'architectural',
    price: 22000000,
    currency: 'USD',
    city: 'Aspen',
    state: 'Colorado',
    country: 'United States',
    address: '1420 Red Mountain Road',
    bedrooms: 5,
    bathrooms: 6,
    sqft: 8600,
    yearBuilt: 2025,
    architect: 'Olson Kundig Architects',
    structuralEngineer: 'KL&A Engineers & Builders',
    status: 'available',
    featured: false,
    heroImage: createArchSvg('Aspen Glass Pavilion', 'Red Mountain, Aspen', 'cantilever'),
    galleryImages: [
      {
        url: createArchSvg('Aspen Glass Pavilion', 'Snow-Dusted Timber Elevation', 'exterior_dusk'),
        caption: 'Heated perimeter roof edges and glowing timber frame against dusk snow',
        category: 'exterior',
      },
      {
        url: createArchSvg('Aspen Glass Pavilion', 'Fireplace Salon & Mountain Vista', 'interior_minimal'),
        caption: 'Raw blackened steel hearth in double-height glass pavilion',
        category: 'interior',
      },
    ],
    floorPlans: [
      {
        name: 'Great Mountain Hall',
        level: 'Main Level',
        areaSqFt: 4800,
        rooms: ['Great Room', 'Alpine Kitchen', 'Heated Veranda', 'Ski Valet & Boot Room'],
        dimensions: '42m x 16m',
      },
    ],
    tourRooms: [
      {
        id: 'salon',
        name: 'Great Mountain Pavilion',
        type: 'salon',
        description: 'Glulam timber structure framing 30-mile views toward the Maroon Bells.',
        cameraPosition: [0, 1.6, 4],
        cameraTarget: [0, 1.3, 0],
        hotspots: [
          {
            title: 'Engineered Glulam Trusses',
            description: 'Custom Douglas fir timber structural spans exceeding 18 meters.',
            position: [0, 2.8, 0],
          },
        ],
      },
    ],
    architecturalHighlights: [
      'Direct ski-in / ski-out access to Aspen Mountain trails',
      'Geothermal snow-melt hydronic driveways and terraces',
      'Bespoke hand-crank kinetic window hardware by Olson Kundig',
    ],
    materials: ['Douglas Fir Glulam', 'Colorado Sandstone', 'Blackened Steel', 'Triple-Pane Structural Glazing'],
  },
  {
    id: 'aura-kyoto-residence',
    title: 'The Kyoto Sukiya Pavilion',
    tagline: 'Modernist interpretation of traditional Japanese Sukiya-zukuri architecture',
    description: 'Set along the tranquil slopes of Higashiyama, this residence pairs centuries-old joinery traditions with modern structural glass and polished black granite. Shading screens of cedar louvers modulate soft afternoon light onto tatami meditation chambers and internal rock gardens.',
    propertyType: 'residence',
    price: 18500000,
    currency: 'USD',
    city: 'Kyoto',
    country: 'Japan',
    address: 'Higashiyama-ku, Kyoto',
    bedrooms: 4,
    bathrooms: 4,
    sqft: 6400,
    yearBuilt: 2024,
    architect: 'Kengo Kuma & Associates',
    structuralEngineer: 'Ove Arup Japan',
    status: 'available',
    featured: false,
    heroImage: createArchSvg('Kyoto Sukiya Pavilion', 'Higashiyama, Kyoto', 'blueprint'),
    galleryImages: [
      {
        url: createArchSvg('Kyoto Sukiya Pavilion', 'Zen Garden & Engawa Veranda', 'exterior_dusk'),
        caption: 'Engawa wooden terrace overlooking traditional dry landscape garden',
        category: 'exterior',
      },
      {
        url: createArchSvg('Kyoto Sukiya Pavilion', 'Tea Ceremony Chamber & Washi Screens', 'interior_minimal'),
        caption: 'Natural cedar wood joinery crafted without a single metallic fastener',
        category: 'interior',
      },
    ],
    floorPlans: [
      {
        name: 'Garden Pavilions',
        level: 'Ground Floor',
        areaSqFt: 4200,
        rooms: ['Shoin Reception', 'Chashitsu Tea Room', 'Open Engawa Gallery', 'Bath Pavilion'],
        dimensions: '36m x 15m',
      },
    ],
    tourRooms: [
      {
        id: 'salon',
        name: 'The Cedar Engawa Salon',
        type: 'salon',
        description: 'Threshold between interior tatami spaces and manicured moss and stone courtyard.',
        cameraPosition: [0, 1.4, 3],
        cameraTarget: [0, 1.1, 0],
        hotspots: [
          {
            title: 'Yoshino Cedar Joinery',
            description: 'Kiln-dried ancient timber joined via Kanawa Tsugi interlocking techniques.',
            position: [-1.5, 1.6, -1.0],
          },
        ],
      },
    ],
    architecturalHighlights: [
      'Master carpenter Miyadaiku construction without metallic nails',
      'Spring water natural onsen fed from subterranean Higashiyama aquifer',
      'Custom hand-loomed Echizen washi sliding panels with embedded gold leaf',
    ],
    materials: ['Yoshino Cedar', 'Black Polished Granite', 'Echizen Washi Paper', 'Handmade Kawara Roof Tiles'],
  },
];
