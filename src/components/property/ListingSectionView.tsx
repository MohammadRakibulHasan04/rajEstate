import React, { useState } from 'react';
import { Building2, Check, FileCheck2, ShieldCheck } from 'lucide-react';
import { Listing, ListingSection } from '../../types/listing';
import { getAmenityIconMeta, normalizeAmenities, toBanglaAmenityDetail, toBanglaAmenityLabel } from '../../lib/amenities';
import { customFacts } from '../../lib/significance';
import { formatMonth, monthsUntil } from '../../lib/format';
import { isImageUrl } from '../../lib/media';
import { publicSectionId, SECTION_META } from '../../lib/sections';
import { DetailList, PageSection } from './PageSection';
import { ProximityRings } from './ProximityRings';
import { ProjectVideoSection } from './ProjectVideoSection';

interface Props {
  listing: Listing;
  section: ListingSection;
  onOpenPlan: (index: number) => void;
  onOpenSatellite?: () => void;
}

/** Renders one admin-configured section of the detail page. */
export const ListingSectionView: React.FC<Props> = ({ listing, section, onOpenPlan, onOpenSatellite }) => {
  const id = publicSectionId(section);

  switch (section.type) {
    case 'specifications':
      return (
        <PageSection id={id} title={SECTION_META.specifications.label}>
          <DetailList items={customFacts(listing).map((f) => ({ key: f.key, label: f.label, value: f.value }))} />
        </PageSection>
      );

    case 'floorPlans':
      return <FloorPlans id={id} listing={listing} onOpen={onOpenPlan} />;

    case 'satellite':
      return <SatelliteView id={id} listing={listing} onOpen={onOpenSatellite} />;

    case 'amenities': {
      const amenities = normalizeAmenities(listing.amenities).filter((a) => a.label.trim());
      return (
        <PageSection id={id} title={SECTION_META.amenities.label} aside={<span className="mono-label">{amenities.length}টি সুবিধা</span>}>
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {amenities.map((item, idx) => {
              const { Icon } = getAmenityIconMeta(item.icon, item.label);
              const labelBn = toBanglaAmenityLabel(item.label);
              const detailBn = toBanglaAmenityDetail(item.detail);
              return (
                <li key={`${item.label}-${idx}`} className="flex items-center gap-3.5 rounded-xl border border-[#181512]/[0.09] bg-white p-3.5">
                  <span className="w-10 h-10 rounded-lg bg-[#9A6B3B]/10 border border-[#9A6B3B]/25 text-[#855B30] flex items-center justify-center shrink-0">
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <span className="min-w-0" lang="bn">
                    <span className="block text-sm font-bn font-medium text-[#181512] truncate">{labelBn}</span>
                    {detailBn ? (
                      <span className="block text-xs font-bn text-[#786F63] truncate mt-0.5">{detailBn}</span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </PageSection>
      );
    }

    case 'location':
      return (
        <PageSection id={id} title={SECTION_META.location.label}>
          <ProximityRings listing={listing} />
        </PageSection>
      );

    case 'legal': {
      const t = listing.trust;
      const items = [
        { icon: Building2, label: 'Developer', value: t.developer },
        { icon: ShieldCheck, label: 'RAJUK Approval', value: t.rajukApproval },
        { icon: FileCheck2, label: 'Land Title', value: t.landTitle },
      ];
      return (
        <PageSection id={id} title={SECTION_META.legal.label}>
          <div className="grid sm:grid-cols-3 gap-3">
            {items.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-[#181512]/[0.09] bg-white p-5">
                <Icon className="w-5 h-5 text-[#9A6B3B]" />
                <div className="mono-label mt-4">{label}</div>
                <div className={`mt-1 text-[15px] ${value?.trim() ? 'text-[#181512] font-medium' : 'text-[#8C8275] italic'}`}>
                  {value?.trim() || 'Available on request'}
                </div>
              </div>
            ))}
          </div>
        </PageSection>
      );
    }

    case 'progress':
      return <Progress id={id} listing={listing} />;

    case 'video':
      return <ProjectVideoSection id={id} listing={listing} />;

    case 'custom':
      return (
        <PageSection id={id} title={section.title}>
          <div className={isImageUrl(section.imageUrl) ? 'grid md:grid-cols-2 gap-8 items-start' : ''}>
            {section.body.trim() && (
              <p lang="bn" className="font-bn text-[17px] sm:text-[18px] leading-[1.85] text-[#2E2822] whitespace-pre-line">
                {section.body}
              </p>
            )}
            {isImageUrl(section.imageUrl) && (
              <img src={section.imageUrl} alt={section.title} loading="lazy" className="w-full rounded-xl border border-[#181512]/10 object-cover" />
            )}
          </div>
        </PageSection>
      );
  }
};

const FloorPlans: React.FC<{ id: string; listing: Listing; onOpen: (i: number) => void }> = ({ id, listing, onOpen }) => {
  const plans = listing.media.floorPlans.filter((p) => isImageUrl(p.url));
  const [active, setActive] = useState(0);
  const plan = plans[Math.min(active, plans.length - 1)];
  if (!plan) return null;
  return (
    <PageSection id={id} title={SECTION_META.floorPlans.label}>
      {plans.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Floor plans">
          {plans.map((p, i) => (
            <button key={p.url + i} type="button" role="tab" aria-selected={i === active} className="chip" data-active={i === active} onClick={() => setActive(i)}>
              {p.caption || `Plan ${i + 1}`}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        id="floorplan-open"
        onClick={() => onOpen(listing.media.floorPlans.indexOf(plan))}
        className="block w-full rounded-2xl overflow-hidden border border-[#181512]/12 bg-white p-4 md:p-6 cursor-zoom-in group"
        aria-label={`Enlarge ${plan.caption || 'floor plan'}`}
      >
        <img src={plan.url} alt={plan.caption || 'Floor plan'} loading="lazy" className="w-full max-h-[620px] object-contain transition-transform duration-700 group-hover:scale-[1.01]" />
      </button>
      {plan.caption && plans.length === 1 && <p className="mt-3 text-sm text-[#6E6559]">{plan.caption}</p>}
    </PageSection>
  );
};

const SatelliteView: React.FC<{ id: string; listing: Listing; onOpen?: () => void }> = ({ id, listing, onOpen }) => {
  const sat = listing.media.satelliteImage;
  if (!sat || !isImageUrl(sat.url)) return null;
  return (
    <PageSection id={id} title={SECTION_META.satellite.label}>
      <button
        type="button"
        id="satellite-open"
        onClick={() => onOpen?.()}
        className="block w-full rounded-2xl overflow-hidden border border-[#181512]/12 bg-white p-3 md:p-4 cursor-zoom-in group shadow-[0_14px_38px_-18px_rgba(24,21,18,0.12)]"
        aria-label={`Enlarge ${sat.caption || 'satellite image'}`}
      >
        <div className="relative overflow-hidden rounded-xl bg-[#EAE3D7]">
          <img
            src={sat.url}
            alt={sat.caption || `${listing.title} satellite view`}
            loading="lazy"
            className="w-full max-h-[620px] object-cover transition-transform duration-700 group-hover:scale-[1.015]"
          />
        </div>
      </button>
      {sat.caption && (
        <p lang="bn" className="mt-3 text-sm font-bn text-[#6E6559]">
          {sat.caption}
        </p>
      )}
    </PageSection>
  );
};

const Progress: React.FC<{ id: string; listing: Listing }> = ({ id, listing }) => {
  const milestones = listing.trust.milestones.filter((m) => m.label.trim());
  const done = milestones.filter((m) => m.done).length;
  const months = monthsUntil(listing.core.handover);
  const status =
    listing.construction === 'ready'
      ? 'Completed'
      : months !== null && months > 0
        ? `Handover in ${months} month${months === 1 ? '' : 's'}`
        : `${done} of ${milestones.length} stages complete`;

  return (
    <PageSection id={id} title={SECTION_META.progress.label} aside={<span className="mono-label">{status}</span>}>
      <div className="h-1.5 rounded-full bg-[#181512]/10 overflow-hidden mb-8">
        <div className="h-full bg-gradient-to-r from-[#855B30] to-[#C89B62]" style={{ width: `${milestones.length ? (done / milestones.length) * 100 : 0}%` }} />
      </div>
      <ol className="space-y-4">
        {milestones.map((m, i) => (
          <li key={i} className="flex items-center gap-4">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${
                m.done ? 'bg-[#9A6B3B] border-[#9A6B3B] text-white' : 'bg-white border-[#181512]/20'
              }`}
            >
              {m.done && <Check className="w-3.5 h-3.5" />}
            </span>
            <span className={`flex-1 text-sm ${m.done ? 'text-[#181512] font-medium' : 'text-[#5C5346]'}`}>{m.label}</span>
            <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#786F63]">{formatMonth(m.date)}</span>
          </li>
        ))}
      </ol>
    </PageSection>
  );
};
