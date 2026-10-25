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
    <div className="group relative bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300 flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950 cursor-pointer" onClick={() => onSelect(property)}>
        <img
          src={property.heroImage}
          alt={property.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase bg-slate-950/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800">
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
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white'
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
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>{property.city}, {property.country}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3
            onClick={() => onSelect(property)}
            className="text-lg font-display font-medium text-white hover:text-cyan-300 transition-colors cursor-pointer line-clamp-1"
          >
            {property.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 font-light leading-relaxed">
            {property.tagline}
          </p>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
            <span>{property.bedrooms} Beds</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{property.bathrooms} Baths</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{property.sqft.toLocaleString()} Sq Ft</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{property.yearBuilt}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] font-mono text-slate-500 truncate max-w-[160px]">
            {property.architect.split(' / ')[0]}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelect(property)}
              className="text-xs font-mono text-white hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
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
