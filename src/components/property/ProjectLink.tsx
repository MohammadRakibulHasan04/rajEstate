import React from 'react';
import { ArrowUpRight, Building2 } from 'lucide-react';
import { Listing, Unit, CONSTRUCTION_LABELS } from '../../types/listing';
import { Link } from '../../lib/router';
import { formatBdt } from '../../lib/format';
import { priceLabel, unitStats } from '../../lib/significance';
import { PageSection } from './PageSection';

const STATUS_LABEL: Record<Unit['status'], string> = { available: 'Available', booked: 'Booked', sold: 'Sold' };

interface Props {
  project: Listing;
  unit?: Unit;
  /** unitId → apartment page, for sibling navigation. */
  unitPages: Record<string, Listing>;
  /** The apartment being viewed (excluded from siblings). */
  currentId: string;
}

/** Link to the project page on a project URL, optionally pre-selecting a unit. */
export function projectHref(project: Listing, unitCode?: string) {
  return `/property/${project.slug}${unitCode ? `?unit=${encodeURIComponent(unitCode)}` : ''}#plan`;
}

/** Shown on a unit page: the project it belongs to and other units in the same building. */
export const ProjectLink: React.FC<Props> = ({ project, unit, unitPages, currentId }) => {
  const stats = unitStats(project);
  const siblings = project.units
    .filter((u) => u.id !== unit?.id)
    .sort((a, b) => Number(b.status === 'available') - Number(a.status === 'available') || a.floor - b.floor || a.code.localeCompare(b.code))
    .slice(0, 12);

  return (
    <PageSection id="building" title="The Project">
      <Link
        to={projectHref(project, unit?.code)}
        id="building-project-link"
        className="group flex flex-col sm:flex-row gap-5 rounded-2xl border border-[#181512]/12 bg-white p-4 hover:border-[#9A6B3B]/60 transition-colors"
      >
        <div className="sm:w-56 aspect-[4/3] rounded-xl overflow-hidden bg-[#E6DFD3] shrink-0">
          {project.media.hero.url ? (
            <img src={project.media.hero.url} alt={project.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#786F63]">
              <Building2 className="w-8 h-8" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <div className="mono-label">
            {CONSTRUCTION_LABELS[project.construction]} · {project.location.area}
          </div>
          <div className="mt-2 font-display text-2xl text-[#181512] group-hover:text-[#7C5329] transition-colors">{project.title}</div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[#4A433B]">
            {project.core.totalFloors ? <span>{project.core.totalFloors} storeys</span> : null}
            {stats.total > 0 && (
              <span>
                {stats.available} of {stats.total} units available
              </span>
            )}
            <span className="text-[#684724] font-medium">{priceLabel(project)}</span>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#9A6B3B]">
            View Project <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </Link>

      {siblings.length > 0 && (
        <div className="mt-6">
          <div className="mono-label mb-3">Other Units in This Building</div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {siblings.map((u) => {
              const page = unitPages[u.id];
              const to = page && page.id !== currentId ? `/property/${page.slug}` : projectHref(project, u.code);
              return (
                <Link
                  key={u.id}
                  to={to}
                  className="unit-cell flex items-center justify-center"
                  data-status={u.status}
                  aria-label={`Unit ${u.code}, ${STATUS_LABEL[u.status]}${u.price ? `, ${formatBdt(u.price)}` : ''}`}
                  title={`${u.code} · ${STATUS_LABEL[u.status]}${u.price ? ` · ${formatBdt(u.price, { short: true })}` : ''}`}
                >
                  {u.code}
                  {page && <span className="unit-page-dot" aria-hidden="true" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </PageSection>
  );
};
