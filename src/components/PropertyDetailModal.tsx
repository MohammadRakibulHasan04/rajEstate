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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181512]/55 backdrop-blur-md p-2 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-[#ffffff] border border-[#181512]/12 rounded-2xl overflow-hidden flex flex-col shadow-2xl text-[#181512] my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#181512]/10 bg-[#ffffff] z-20">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#9A6B3B]">
                <span>{property.propertyType.toUpperCase()} ARCHITECTURAL MEDIA</span>
                <span className="text-[#786F63]">·</span>
                <span>{property.city}, {property.country}</span>
              </div>
              <h2 className="text-xl font-display font-medium text-[#181512] truncate max-w-xl">
                {property.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSaveProperty(property.id)}
              className={`p-2.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer ${
                isSaved
                  ? 'bg-[#9A6B3B]/15 text-[#5C3D1E] border-[#9A6B3B]'
                  : 'bg-[#F3EFE7] text-[#4A433B] border-[#181512]/12 hover:text-[#181512]'
              }`}
              title="Save to Portfolio"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-lg bg-[#F3EFE7] text-[#4A433B] border border-[#181512]/12 hover:text-[#181512] transition-colors cursor-pointer"
              title="Share Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-lg bg-[#F3EFE7] text-[#4A433B] hover:text-[#181512] border border-[#181512]/12 transition-colors ml-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-[#181512]/10 group">
            <img
              src={property.heroImage}
              alt={property.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181512]/85 via-[#181512]/30 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-sm font-light text-[#FAF7F2] max-w-xl italic">
                  "{property.tagline}"
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-[#E6DFD3] mt-2">
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
                  className="btn-gold !py-2.5 !px-5"
                >
                  SCHEDULE VIEWING
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#FCFBF8] border border-[#181512]/10 rounded-xl gap-4">
            <div>
              <span className="text-xs font-mono text-[#786F63] uppercase">Valuation</span>
              <div className="text-2xl font-mono font-medium text-[#181512]">
                {property.currency === 'USD' ? '$' : '€'}
                {(property.price / 1000000).toFixed(1)}M {property.currency}
              </div>
            </div>
            <div className="flex flex-col sm:items-end">
              <span className="text-xs font-mono text-[#786F63] uppercase">Lead Architect</span>
              <div className="text-sm font-medium text-[#181512]">
                {property.architect}
              </div>
              <div className="text-xs text-[#5C5346] font-mono mt-0.5">
                {property.structuralEngineer}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-[#181512]/10 pb-2">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-[#9A6B3B]/15 text-[#5C3D1E] border border-[#9A6B3B]/40'
                  : 'text-[#5C5346] hover:text-[#181512]'
              }`}
            >
              High-Res Image Galleries ({allImages.length})
            </button>
            <button
              onClick={() => setActiveTab('floorplans')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'floorplans'
                  ? 'bg-[#9A6B3B]/15 text-[#5C3D1E] border border-[#9A6B3B]/40'
                  : 'text-[#5C5346] hover:text-[#181512]'
              }`}
            >
              Architectural Floor Plans ({property.floorPlans.length})
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'specs'
                  ? 'bg-[#9A6B3B]/15 text-[#5C3D1E] border border-[#9A6B3B]/40'
                  : 'text-[#5C5346] hover:text-[#181512]'
              }`}
            >
              Engineering & Material Specs
            </button>
          </div>

          {activeTab === 'gallery' && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 p-1 bg-[#EFEAE1] rounded-lg w-fit border border-[#181512]/10">
                {(['all', 'exterior', 'interior', 'detail'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setGalleryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-mono capitalize rounded-md transition-colors cursor-pointer ${
                      galleryFilter === cat
                        ? 'bg-[#FCFBF8] text-[#684724] font-semibold shadow-xs'
                        : 'text-[#5C5346] hover:text-[#181512]'
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
                    className="relative aspect-video rounded-xl overflow-hidden border border-[#181512]/10 group cursor-pointer bg-[#EAE3D7]"
                  >
                    <img
                      src={img.url}
                      alt={img.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                      <span className="text-xs font-mono text-[#E4C799] capitalize">{img.category}</span>
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
                  <div key={idx} className="p-5 bg-[#FCFBF8] border border-[#181512]/10 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-[#9A6B3B]">
                      <span>{fp.level}</span>
                      <span>{fp.areaSqFt.toLocaleString()} SQ FT</span>
                    </div>
                    <h4 className="text-base font-display font-medium text-[#181512]">{fp.name}</h4>
                    <div className="text-xs font-mono text-[#5C5346]">DIMENSIONS: {fp.dimensions}</div>
                    <div className="pt-2 border-t border-[#181512]/10">
                      <span className="text-[10px] font-mono text-[#786F63] uppercase">Programmed Spaces:</span>
                      <ul className="mt-1 space-y-1">
                        {fp.rooms.map((room, rIdx) => (
                          <li key={rIdx} className="text-xs text-[#3D362E] flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#9A6B3B]" />
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
              <div className="p-5 bg-[#FCFBF8] border border-[#181512]/10 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-[#9A6B3B]">
                  <Shield className="w-4 h-4" />
                  <span>STRUCTURAL & SUSTAINABILITY HIGHLIGHTS</span>
                </div>
                <ul className="space-y-2.5">
                  {property.architecturalHighlights.map((hl, idx) => (
                    <li key={idx} className="text-xs text-[#3D362E] flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#9A6B3B] shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 bg-[#FCFBF8] border border-[#181512]/10 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-[#9A6B3B]">
                  <Sparkles className="w-4 h-4" />
                  <span>MATERIAL SPECIFICATION PALETTE</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {property.materials.map((mat, idx) => (
                    <div key={idx} className="p-3 bg-[#F3EFE7] border border-[#181512]/10 rounded-lg text-xs font-mono text-[#3D362E]">
                      {mat}
                    </div>
                  ))}
                </div>

                {property.completionNarrative && (
                  <div className="pt-4 border-t border-[#181512]/10">
                    <span className="text-[10px] font-mono text-[#786F63] uppercase">Development Timeline</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      <div className="text-[11px] font-mono text-[#3D362E]">
                        <span className="text-[#786F63] block">CAD Plan:</span>
                        {property.completionNarrative.blueprintDate}
                      </div>
                      <div className="text-[11px] font-mono text-[#3D362E]">
                        <span className="text-[#786F63] block">Groundbreak:</span>
                        {property.completionNarrative.groundbreakDate}
                      </div>
                      <div className="text-[11px] font-mono text-[#3D362E]">
                        <span className="text-[#786F63] block">Framing:</span>
                        {property.completionNarrative.framingDate}
                      </div>
                      <div className="text-[11px] font-mono text-[#3D362E]">
                        <span className="text-[#786F63] block">Handover:</span>
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
          <div className="fixed inset-0 z-60 bg-[#ffffff]/97 backdrop-blur-xl flex flex-col items-center justify-between p-6">
            <div className="w-full flex items-center justify-between text-xs font-mono text-[#4A433B]">
              <span>{filteredImages[lightboxIndex]?.caption}</span>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 text-[#4A433B] hover:text-[#181512] cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative max-w-5xl w-full flex-1 flex items-center justify-center my-4">
              <img
                src={filteredImages[lightboxIndex]?.url}
                alt={filteredImages[lightboxIndex]?.caption}
                referrerPolicy="no-referrer"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-[#181512]/10"
              />

              <button
                onClick={() => setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : filteredImages.length - 1))}
                className="absolute left-2 p-3 bg-[#FCFBF8]/90 border border-[#181512]/15 rounded-full text-[#181512] hover:border-[#9A6B3B] shadow-md transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setLightboxIndex((prev) => (prev! < filteredImages.length - 1 ? prev! + 1 : 0))}
                className="absolute right-2 p-3 bg-[#FCFBF8]/90 border border-[#181512]/15 rounded-full text-[#181512] hover:border-[#9A6B3B] shadow-md transition-colors cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="text-xs font-mono text-[#786F63]">
              IMAGE {lightboxIndex + 1} OF {filteredImages.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
