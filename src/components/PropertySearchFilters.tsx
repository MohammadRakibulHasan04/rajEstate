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
    <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search by architectural master, city, or feature..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-mono cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTypeChange(t.value)}
              className={`px-3.5 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filters.propertyType === t.value
                  ? 'bg-slate-800 text-cyan-300 font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-slate-800/80">
        <div>
          <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Geographic Territory</span>
          </label>
          <select
            value={filters.location}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
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
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Valuation Cap</span>
            </span>
            <span className="text-white font-medium">Up to ${(filters.maxPrice / 1000000).toFixed(0)}M</span>
          </div>
          <input
            type="range"
            min="10000000"
            max="50000000"
            step="2000000"
            value={filters.maxPrice}
            onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>$10M</span>
            <span>$50M+</span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Curation Order</span>
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="featured">Editorial Significance (Curated)</option>
            <option value="price-desc">Valuation: High to Low</option>
            <option value="price-asc">Valuation: Low to High</option>
            <option value="area-desc">Floor Area: Largest First</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span>PORTFOLIO SELECTION</span>
          <span className="text-slate-600">·</span>
          <span className="text-cyan-400 font-semibold">{totalResults} PROPERTIES READY FOR VIEWING</span>
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
            className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
