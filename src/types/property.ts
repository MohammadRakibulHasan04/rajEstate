export type PropertyType = 'villa' | 'penthouse' | 'residence' | 'estate' | 'architectural';
export type PropertyStatus = 'available' | 'reserved' | 'completed';

export interface RoomTourPoint {
  id: string;
  name: string;
  type: 'salon' | 'terrace' | 'master_suite' | 'atrium' | 'infinity_pool';
  description: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  hotspots: {
    title: string;
    description: string;
    position: [number, number, number];
  }[];
}

export interface FloorPlan {
  name: string;
  level: string;
  areaSqFt: number;
  rooms: string[];
  dimensions: string;
}

export interface Property {
  id: string;
  title: string;
  tagline: string;
  description: string;
  propertyType: PropertyType;
  price: number;
  currency: string;
  city: string;
  state?: string;
  country: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  architect: string;
  structuralEngineer: string;
  status: PropertyStatus;
  featured: boolean;
  heroImage: string;
  galleryImages: {
    url: string;
    caption: string;
    category: 'exterior' | 'interior' | 'aerial' | 'detail';
  }[];
  floorPlans: FloorPlan[];
  tourRooms: RoomTourPoint[];
  architecturalHighlights: string[];
  materials: string[];
  completionNarrative?: {
    blueprintDate: string;
    groundbreakDate: string;
    framingDate: string;
    handoverDate: string;
  };
}

export interface TourInquiry {
  id?: string;
  propertyId: string;
  propertyTitle: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  tourType: 'virtual-3d' | 'in-person' | 'architectural-consultation';
  preferredDate: string;
  message: string;
  status: 'pending' | 'confirmed' | 'completed';
  createdAt: string;
}
