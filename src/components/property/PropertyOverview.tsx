import React from 'react';
import { SpecItem } from '../../lib/significance';
import { DetailList, PageSection } from './PageSection';

/** Description (Bangla) followed by the remaining property details. */
export const PropertyOverview: React.FC<{ summary: string; details: SpecItem[] }> = ({ summary, details }) => {
  if (!summary.trim() && !details.length) return null;
  return (
    <PageSection id="overview" title="Overview">
      {summary.trim() && (
        <p lang="bn" className="font-bn text-[17.5px] sm:text-[18.5px] leading-[1.85] text-[#2E2822] whitespace-pre-line max-w-3xl">
          {summary}
        </p>
      )}
      {details.length > 0 && (
        <div className={summary.trim() ? 'mt-10' : ''}>
          <h3 className="mono-label mb-2">Property Details</h3>
          <DetailList items={details} />
        </div>
      )}
    </PageSection>
  );
};
