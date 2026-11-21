import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Listing } from '../../types/listing';
import { scoreListing } from '../../lib/completeness';

interface ScoreMeterProps {
  listing: Listing;
  onNavigateSection?: (sectionId: string) => void;
}

/** Listing completeness checklist. Each open item links to the field that fixes it. */
export const ScoreMeter: React.FC<ScoreMeterProps> = ({ listing, onNavigateSection }) => {
  const { score, tips } = scoreListing(listing);
  const label = score >= 90 ? 'Ready to Publish' : score >= 60 ? 'Almost There' : 'Needs Details';
  const bar = score >= 90 ? 'bg-emerald-600' : score >= 60 ? 'bg-[#9A6B3B]' : 'bg-amber-500';
  const open = tips.filter((t) => !t.done);

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <span className="mono-label block">Completeness</span>
          <span className="text-sm font-medium text-[#181512]">{label}</span>
        </div>
        <span className="font-display text-3xl text-[#181512]">{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#181512]/10 overflow-hidden" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Listing completeness">
        <div className={`h-full ${bar} transition-all duration-500`} style={{ width: `${Math.max(3, score)}%` }} />
      </div>
      <ul className="space-y-1 max-h-72 overflow-y-auto -mx-1">
        {[...open, ...tips.filter((t) => t.done)].map((tip) => (
          <li key={tip.label}>
            <button
              type="button"
              disabled={tip.done || !onNavigateSection}
              onClick={() => onNavigateSection?.(tip.target)}
              className={`w-full flex items-start gap-2.5 text-left text-xs py-1.5 px-1 rounded-md ${tip.done ? 'text-[#786F63] cursor-default' : 'text-[#3D362E] hover:bg-amber-500/10 cursor-pointer'}`}
            >
              {tip.done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-px" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-px" />}
              <span className="leading-snug">{tip.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
