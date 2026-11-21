import React, { useEffect, useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { Listing } from '../../types/listing';
import { parseVideoEmbed } from '../../lib/media';
import { SECTION_META } from '../../lib/sections';
import { PageSection } from './PageSection';

interface Props {
  listing: Listing;
  id?: string;
}

/**
 * Clean architectural video presentation component.
 * Placed after Basic Info (PropertyHeader) and before the Overview section.
 */
export const ProjectVideoSection: React.FC<Props> = ({ listing, id = 'video' }) => {
  const rawUrl = listing.media.videoUrl?.trim();
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setThumbFailed(false);
  }, [rawUrl]);

  if (!rawUrl) return null;

  const meta = parseVideoEmbed(rawUrl);

  const posterUrl =
    (!thumbFailed ? meta?.thumbnailUrl : meta?.fallbackThumbnailUrl) ||
    meta?.fallbackThumbnailUrl ||
    listing.media.hero?.url?.trim() ||
    '';

  return (
    <PageSection id={id} title={SECTION_META.video.label}>
      {meta ? (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#181512]/12 bg-[#0E0C0A] shadow-[0_24px_65px_-20px_rgba(24,21,18,0.2)]">
          {!playing ? (
            <button
              type="button"
              id="project-video-play"
              onClick={() => setPlaying(true)}
              className="group relative w-full h-full block cursor-pointer focus:outline-none"
              aria-label={`Play ${listing.title} project overview video`}
            >
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={listing.title}
                  onError={() => setThumbFailed(true)}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#24201B] via-[#181512] to-[#0E0C0A]" />
              )}

              <div className="pointer-events-none absolute inset-0 bg-black/25 transition-colors duration-300 group-hover:bg-black/35" />

              {/* Only the centered Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FAF7F2]/95 group-hover:bg-[#9A6B3B] text-[#181512] group-hover:text-white border border-[#181512]/15 flex items-center justify-center shadow-[0_18px_45px_rgba(0,0,0,0.45)] transition-all duration-300 group-hover:scale-105">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                </span>
              </div>
            </button>
          ) : meta.provider === 'direct' ? (
            <video
              src={meta.embedUrl}
              poster={posterUrl || undefined}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            >
              Your browser does not support embedded HTML5 video.
            </video>
          ) : (
            <iframe
              src={meta.autoplayUrl}
              title={`${listing.title} — Project Overview Video`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          )}
        </div>
      ) : (
        <a
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-quiet"
        >
          <Play className="w-3.5 h-3.5 fill-current text-[#9A6B3B]" />
          <span>Watch Video</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </PageSection>
  );
};
