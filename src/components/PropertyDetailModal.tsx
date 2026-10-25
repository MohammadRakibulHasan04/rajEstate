import React, { useState } from 'react';
import { Property } from '../types/property';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Compass,
  Bookmark,
  Share2,
  Calendar,
  Layers,
  MapPin,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sparkles,
  Check,
} from 'lucide-react';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
  onBookTour: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  onClose,
  onBookTour,
}) => {
  const { isPropertySaved, toggleSaveProperty } = useAuth();
  const [activeTab, setActiveTab] = useState<'gallery' | 'floorplans' | 'specs'>('gallery');
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'exterior' | 'interior' | 'detail'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const isSaved = isPropertySaved(property.id);

  const allImages = [
    { url: property.heroImage, caption: `${property.title} · Primary Master Elevation`, category: 'exterior' as const },
    ...property.galleryImages,
  ];

  const filteredImages = galleryFilter === 'all'
    ? allImages
    : allImages.filter((img) => img.category === galleryFilter);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl text-slate-100 my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 z-20">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <span>{property.propertyType.toUpperCase()} ARCHITECTURAL MEDIA</span>
                <span className="text-slate-500">·</span>
                <span>{property.city}, {property.country}</span>
              </div>
              <h2 className="text-xl font-display font-medium text-white truncate max-w-xl">
                {property.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSaveProperty(property.id)}
              className={`p-2.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer ${
                isSaved
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:text-white'
              }`}
              title="Save to Portfolio"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700/80 hover:text-white transition-colors cursor-pointer"
              title="Share Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ml-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-800 group">
            <img
              src={property.heroImage}
              alt={property.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-sm font-light text-slate-300 max-w-xl italic">
                  "{property.tagline}"
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-2">
                  <span>{property.bedrooms} BEDROOMS</span>
                  <span>·</span>
                  <span>{property.bathrooms} BATHROOMS</span>
                  <span>·</span>
                  <span>{property.sqft.toLocaleString()} SQ FT</span>
                  <span>·</span>
                  <span>BUILT {property.yearBuilt}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onBookTour(property)}
                  className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-medium border border-white/20 backdrop-blur-md transition-all whitespace-nowrap cursor-pointer"
                >
                  SCHEDULE VIEWING
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-xl gap-4">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase">Valuation</span>
              <div className="text-2xl font-mono font-medium text-white">
                {property.currency === 'USD' ? '$' : '€'}
                {(property.price / 1000000).toFixed(1)}M {property.currency}
              </div>
            </div>
            <div className="flex flex-col sm:items-end">
              <span className="text-xs font-mono text-slate-400 uppercase">Lead Architect</span>
              <div className="text-sm font-medium text-slate-200">
                {property.architect}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {property.structuralEngineer}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              High-Res Image Galleries ({allImages.length})
            </button>
            <button
              onClick={() => setActiveTab('floorplans')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'floorplans'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Architectural Floor Plans ({property.floorPlans.length})
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'specs'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Engineering & Material Specs
            </button>
          </div>

          {activeTab === 'gallery' && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg w-fit border border-slate-800">
                {(['all', 'exterior', 'interior', 'detail'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setGalleryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-mono capitalize rounded-md transition-colors cursor-pointer ${
                      galleryFilter === cat
                        ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 group cursor-pointer bg-slate-900"
                  >
                    <img
                      src={img.url}
                      alt={img.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                      <span className="text-xs font-mono text-cyan-300 capitalize">{img.category}</span>
                      <p className="text-xs text-white line-clamp-2 mt-0.5">{img.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'floorplans' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {property.floorPlans.map((fp, idx) => (
                  <div key={idx} className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                      <span>{fp.level}</span>
                      <span>{fp.areaSqFt.toLocaleString()} SQ FT</span>
                    </div>
                    <h4 className="text-base font-display font-medium text-white">{fp.name}</h4>
                    <div className="text-xs font-mono text-slate-400">DIMENSIONS: {fp.dimensions}</div>
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Programmed Spaces:</span>
                      <ul className="mt-1 space-y-1">
                        {fp.rooms.map((room, rIdx) => (
                          <li key={rIdx} className="text-xs text-slate-300 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-cyan-400" />
                            <span>{room}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <Shield className="w-4 h-4" />
                  <span>STRUCTURAL & SUSTAINABILITY HIGHLIGHTS</span>
                </div>
                <ul className="space-y-2.5">
                  {property.architecturalHighlights.map((hl, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span>MATERIAL SPECIFICATION PALETTE</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {property.materials.map((mat, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
                      {mat}
                    </div>
                  ))}
                </div>

                {property.completionNarrative && (
                  <div className="pt-4 border-t border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Development Timeline</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      <div className="text-[11px] font-mono text-slate-300">
                        <span className="text-slate-500 block">CAD Plan:</span>
                        {property.completionNarrative.blueprintDate}
                      </div>
                      <div className="text-[11px] font-mono text-slate-300">
                        <span className="text-slate-500 block">Groundbreak:</span>
                        {property.completionNarrative.groundbreakDate}
                      </div>
                      <div className="text-[11px] font-mono text-slate-300">
                        <span className="text-slate-500 block">Framing:</span>
                        {property.completionNarrative.framingDate}
                      </div>
                      <div className="text-[11px] font-mono text-slate-300">
                        <span className="text-slate-500 block">Handover:</span>
                        {property.completionNarrative.handoverDate}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {lightboxIndex !== null && (
          <div className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-between p-6">
            <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{filteredImages[lightboxIndex]?.caption}</span>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative max-w-5xl w-full flex-1 flex items-center justify-center my-4">
              <img
                src={filteredImages[lightboxIndex]?.url}
                alt={filteredImages[lightboxIndex]?.caption}
                referrerPolicy="no-referrer"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />

              <button
                onClick={() => setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : filteredImages.length - 1))}
                className="absolute left-2 p-3 bg-black/60 rounded-full text-white hover:bg-black/90 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setLightboxIndex((prev) => (prev! < filteredImages.length - 1 ? prev! + 1 : 0))}
                className="absolute right-2 p-3 bg-black/60 rounded-full text-white hover:bg-black/90 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="text-xs font-mono text-slate-500">
              IMAGE {lightboxIndex + 1} OF {filteredImages.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
