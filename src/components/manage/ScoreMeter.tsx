import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Listing } from '../../types/listing';
import { scoreListing, factsByTier } from '../../lib/significance';

interface ScoreMeterProps {
  listing: Listing;
  onNavigateSection?: (sectionId: string) => void;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({ listing, onNavigateSection }) => {
  const { score, tips } = scoreListing(listing);
  const { signature, defining, reference } = factsByTier(listing);

  // Score color grading
  const scoreColor =
    score >= 85
      ? 'from-emerald-400 to-[#d1ad7a]'
      : score >= 60
      ? 'from-[#d1ad7a] to-amber-400'
      : 'from-amber-500 to-rose-400';

  const scoreLabel =
    score >= 85
      ? 'Exceptional Story'
      : score >= 65
      ? 'Compelling'
      : score >= 40
      ? 'Developing'
      : 'Needs Details';

  return (
    <div className="panel p-5 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="mono-label !text-[#d1ad7a] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Significance Meter
          </span>
          <h3 className="font-display text-2xl text-[#f4efe6] mt-1">{scoreLabel}</h3>
        </div>
        <div className="text-right">
          <span className="font-display text-4xl text-gradient-gold font-light">{score}%</span>
        </div>
      </div>

      {/* Progress rail */}
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${scoreColor} transition-all duration-700 ease-out`}
          style={{ width: `${Math.max(4, score)}%` }}
        />
      </div>

      {/* Tier Breakdown Badges */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/[0.08] text-center">
        <div className="p-2 rounded-lg bg-white/[0.02]">
          <span className="mono-label block text-[9px]">Signature</span>
          <span
            className={`font-display text-lg ${
              signature.length >= 1 ? 'text-[#f1dfbd]' : 'text-slate-500'
            }`}
          >
            {signature.length} / 3
          </span>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02]">
          <span className="mono-label block text-[9px]">Defining</span>
          <span
            className={`font-display text-lg ${
              defining.length >= 4 ? 'text-[#f1dfbd]' : 'text-slate-500'
            }`}
          >
            {defining.length}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02]">
          <span className="mono-label block text-[9px]">Reference</span>
          <span className="font-display text-lg text-slate-400">{reference.length}</span>
        </div>
      </div>

      {/* Actionable Checklist */}
      <div className="space-y-2.5">
        <span className="mono-label block text-[10px]">Story checklist</span>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {tips.map((tip, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 text-xs py-1.5 px-2 rounded-lg transition-colors ${
                tip.done
                  ? 'text-slate-300'
                  : 'text-amber-200/90 bg-amber-500/[0.05] border border-amber-500/10'
              }`}
            >
              {tip.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span className="flex-1 leading-snug">{tip.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
