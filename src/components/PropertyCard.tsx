import React from 'react';
import { Property } from '../types/property';
import { useAuth } from '../context/AuthContext';
import { Bookmark, Compass, ArrowUpRight, MapPin } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onSelect: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSelect,
}) => {
  const { isPropertySaved, toggleSaveProperty } = useAuth();
  const isSaved = isPropertySaved(property.id);

  return (
    <div className="group relative bg-[#ffffff] border border-[#181512]/10 rounded-2xl overflow-hidden hover:border-[#9A6B3B]/50 transition-all duration-300 flex flex-col shadow-xs">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#EAE3D7] cursor-pointer" onClick={() => onSelect(property)}>
        <img
          src={property.heroImage}
          alt={property.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#181512]/80 via-[#181512]/20 to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <span className="text-[11px] font-mono tracking-widest text-[#181512] uppercase bg-[#FAF7F2]/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#181512]/10">
            {property.propertyType}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSaveProperty(property.id);
              }}
              className={`p-2 rounded-lg backdrop-blur-md border transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-[#9A6B3B] text-white border-[#9A6B3B]'
                  : 'bg-[#FAF7F2]/85 text-[#3D362E] border-[#181512]/12 hover:text-[#181512]'
              }`}
              title="Save to Portfolio"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-10 pointer-events-none">
          <div>
            <div className="text-xl font-mono font-medium text-white tabular-nums">
              {property.currency === 'USD' ? '$' : '€'}
              {(property.price / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs font-mono text-[#E6DFD3] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#E4C799]" />
              <span>{property.city}, {property.country}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3
            onClick={() => onSelect(property)}
            className="text-lg font-display font-medium text-[#181512] hover:text-[#9A6B3B] transition-colors cursor-pointer line-clamp-1"
          >
            {property.title}
          </h3>

          <p className="text-xs text-[#4A433B] line-clamp-2 mt-1.5 font-light leading-relaxed">
            {property.tagline}
          </p>

          <div className="flex items-center gap-2 text-xs font-mono text-[#5C5346] mt-3 pt-3 border-t border-[#181512]/10">
            <span>{property.bedrooms} Beds</span>
            <span aria-hidden="true" className="text-[#8C8275]">·</span>
            <span>{property.bathrooms} Baths</span>
            <span aria-hidden="true" className="text-[#8C8275]">·</span>
            <span>{property.sqft.toLocaleString()} Sq Ft</span>
            <span aria-hidden="true" className="text-[#8C8275]">·</span>
            <span>{property.yearBuilt}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] font-mono text-[#786F63] truncate max-w-[160px]">
            {property.architect.split(' / ')[0]}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelect(property)}
              className="text-xs font-mono text-[#181512] hover:text-[#9A6B3B] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Explore</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
