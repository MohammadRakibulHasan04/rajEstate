import React, { useMemo } from 'react';
import { Property } from '../types/property';
import { useAuth } from '../context/AuthContext';
import { usePublishedListings } from '../lib/listings';
import { displayTitle, hasCustomName, isPriceAsTitle, priceLabel } from '../lib/significance';
import { navigate } from '../lib/router';
import { X, Bookmark, Trash2 } from 'lucide-react';

interface SavedPortfolioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allProperties: Property[];
  onSelectProperty: (property: Property) => void;
}

export const SavedPortfolioDrawer: React.FC<SavedPortfolioDrawerProps> = ({
  isOpen,
  onClose,
  allProperties,
  onSelectProperty,
}) => {
  const { savedPropertyIds, toggleSaveProperty } = useAuth();
  const { listings } = usePublishedListings();

  const savedListings = useMemo(
    () => listings.filter((l) => savedPropertyIds.includes(l.id) || savedPropertyIds.includes(l.slug)),
    [listings, savedPropertyIds]
  );

  const matchedIds = useMemo(
    () => new Set(savedListings.flatMap((l) => [l.id, l.slug])),
    [savedListings]
  );

  const savedLegacyProperties = useMemo(
    () => allProperties.filter((p) => savedPropertyIds.includes(p.id) && !matchedIds.has(p.id)),
    [allProperties, savedPropertyIds, matchedIds]
  );

  const totalCount = savedListings.length + savedLegacyProperties.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#181512]/35 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#ffffff] border-l border-[#181512]/12 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-[#181512]/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#9A6B3B]">
              <Bookmark className="w-3.5 h-3.5" />
              <span>SAVED ARCHITECTURAL PORTFOLIO</span>
            </div>
            <h3 className="text-lg font-display font-medium text-[#181512] mt-0.5">
              Curated Favorites ({totalCount})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#4A433B] hover:text-[#181512] rounded-lg bg-[#F8F7F4] border border-[#181512]/12 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {totalCount === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 text-[#6E6559]">
              <Bookmark className="w-10 h-10 opacity-40 stroke-1 text-[#9A6B3B]" />
              <p className="text-sm font-mono text-[#3D362E]">No architectural properties saved yet.</p>
              <p className="text-xs text-[#786F63] max-w-xs">
                Explore our portfolio and bookmark properties to curate your saved collection.
              </p>
            </div>
          ) : (
            <>
              {savedListings.map((listing) => {
                const title = isPriceAsTitle(listing) && hasCustomName(listing) ? listing.title : displayTitle(listing);
                const price = priceLabel(listing);
                const loc = [listing.location.area, listing.location.city].filter(Boolean).join(', ');
                return (
                  <div
                    key={listing.id}
                    className="group relative bg-[#ffffff] border border-[#181512]/10 rounded-xl p-3 flex gap-4 hover:border-[#9A6B3B]/50 transition-colors shadow-2xs"
                  >
                    <div
                      className="w-24 h-24 rounded-lg overflow-hidden bg-[#EAE3D7] shrink-0 cursor-pointer"
                      onClick={() => {
                        onClose();
                        navigate(`/property/${listing.slug}`);
                      }}
                    >
                      {listing.media.hero.url && (
                        <img
                          src={listing.media.hero.url}
                          alt={title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4
                          onClick={() => {
                            onClose();
                            navigate(`/property/${listing.slug}`);
                          }}
                          className="text-sm font-display font-medium text-[#181512] hover:text-[#9A6B3B] truncate cursor-pointer"
                        >
                          {title}
                        </h4>
                        <div lang="bn" className="text-xs font-nakkhatra text-[#855B30] font-normal mt-0.5">
                          {price}
                        </div>
                        <div className="text-[11px] font-mono text-[#6E6559] mt-1 truncate">
                          {loc}
                        </div>
                      </div>

                      <div className="flex items-center justify-end pt-2">
                        <button
                          onClick={() => toggleSaveProperty(listing.id)}
                          className="p-1 text-[#786F63] hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {savedLegacyProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="group relative bg-[#ffffff] border border-[#181512]/10 rounded-xl p-3 flex gap-4 hover:border-[#9A6B3B]/50 transition-colors shadow-2xs"
                >
                  <div
                    className="w-24 h-24 rounded-lg overflow-hidden bg-[#EAE3D7] shrink-0 cursor-pointer"
                    onClick={() => {
                      onSelectProperty(prop);
                      onClose();
                    }}
                  >
                    <img
                      src={prop.heroImage}
                      alt={prop.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => {
                          onSelectProperty(prop);
                          onClose();
                        }}
                        className="text-sm font-display font-medium text-[#181512] hover:text-[#9A6B3B] truncate cursor-pointer"
                      >
                        {prop.title}
                      </h4>
                      <div className="text-xs font-mono text-[#855B30] font-medium tabular-nums mt-0.5">
                        ${(prop.price / 1000000).toFixed(1)}M {prop.currency}
                      </div>
                      <div className="text-[11px] font-mono text-[#6E6559] mt-1">
                        {prop.city}, {prop.country}
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <button
                        onClick={() => toggleSaveProperty(prop.id)}
                        className="p-1 text-[#786F63] hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
