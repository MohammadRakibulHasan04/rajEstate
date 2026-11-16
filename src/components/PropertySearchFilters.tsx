import React from 'react';
import { PropertyType } from '../types/property';
import { Search, MapPin, DollarSign, ArrowUpDown } from 'lucide-react';

export interface FilterState {
  searchQuery: string;
  propertyType: 'all' | PropertyType;
  location: string;
  minPrice: number;
  maxPrice: number;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'area-desc';
}

interface PropertySearchFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableLocations: string[];
  totalResults: number;
}

const PROPERTY_TYPES: { label: string; value: 'all' | PropertyType }[] = [
  { label: 'All Typologies', value: 'all' },
  { label: 'Villas', value: 'villa' },
  { label: 'Penthouses', value: 'penthouse' },
  { label: 'Residences', value: 'residence' },
  { label: 'Estates', value: 'estate' },
  { label: 'Architectural', value: 'architectural' },
];

export const PropertySearchFilters: React.FC<PropertySearchFiltersProps> = ({
  filters,
  onChange,
  availableLocations,
  totalResults,
}) => {
  const handleTypeChange = (type: 'all' | PropertyType) => {
    onChange({ ...filters, propertyType: type });
  };

  const handleLocationChange = (loc: string) => {
    onChange({ ...filters, location: loc });
  };

  const handleMaxPriceChange = (val: number) => {
    onChange({ ...filters, maxPrice: val });
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    onChange({ ...filters, sortBy });
  };

  return (
    <div className="w-full bg-[#FCFBF8] backdrop-blur-md border border-[#181512]/10 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#786F63]" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search by architectural master, city, or feature..."
            className="lux-input !pl-10 !pr-4 !py-2.5 !text-xs font-mono"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#786F63] hover:text-[#181512] text-xs font-mono cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#EFEAE1] border border-[#181512]/10 rounded-xl overflow-x-auto">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTypeChange(t.value)}
              className={`px-3.5 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filters.propertyType === t.value
                  ? 'bg-[#FCFBF8] text-[#5C3D1E] font-medium shadow-2xs'
                  : 'text-[#5C5346] hover:text-[#181512]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-[#181512]/10">
        <div>
          <label className="block text-[11px] font-mono text-[#6E6559] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#9A6B3B]" />
            <span>Geographic Territory</span>
          </label>
          <select
            value={filters.location}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="lux-select !py-2 !text-xs font-mono"
          >
            <option value="all">All Global Locations ({availableLocations.length})</option>
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#6E6559] uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#9A6B3B]" />
              <span>Valuation Cap</span>
            </span>
            <span className="text-[#181512] font-medium">Up to ${(filters.maxPrice / 1000000).toFixed(0)}M</span>
          </div>
          <input
            type="range"
            min="10000000"
            max="50000000"
            step="2000000"
            value={filters.maxPrice}
            onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
            className="w-full accent-[#9A6B3B] cursor-pointer h-1.5 bg-[#E5DEC9] rounded-lg"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-[#786F63] mt-1">
            <span>$10M</span>
            <span>$50M+</span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[#6E6559] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#9A6B3B]" />
            <span>Curation Order</span>
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="lux-select !py-2 !text-xs font-mono"
          >
            <option value="featured">Editorial Significance (Curated)</option>
            <option value="price-desc">Valuation: High to Low</option>
            <option value="price-asc">Valuation: Low to High</option>
            <option value="area-desc">Floor Area: Largest First</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#181512]/10 text-xs font-mono text-[#6E6559]">
        <div className="flex items-center gap-2">
          <span>PORTFOLIO SELECTION</span>
          <span className="text-[#8C8275]">·</span>
          <span className="text-[#9A6B3B] font-semibold">{totalResults} PROPERTIES READY FOR VIEWING</span>
        </div>
        {(filters.searchQuery || filters.propertyType !== 'all' || filters.location !== 'all' || filters.maxPrice < 50000000) && (
          <button
            onClick={() =>
              onChange({
                searchQuery: '',
                propertyType: 'all',
                location: 'all',
                minPrice: 0,
                maxPrice: 50000000,
                sortBy: 'featured',
              })
            }
            className="text-[#9A6B3B] hover:text-[#684724] underline cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
