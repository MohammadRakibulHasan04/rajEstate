import React from 'react';
import { ArrowUpRight, Building2, Layers } from 'lucide-react';
import { Listing, Unit, UnitStatus, CONSTRUCTION_LABELS } from '../../types/listing';
import { Link } from '../../lib/router';
import { formatBdt, ordinal } from '../../lib/format';
import { priceLabel, unitStats } from '../../lib/significance';

const STATUS_LABEL: Record<UnitStatus, string> = { available: 'Available', booked: 'Booked', sold: 'Sold' };

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

/**
 * Shown on an apartment page: the building it belongs to, where this home
 * sits in it, and quick links to other homes in the same building.
 */
export const ProjectLink: React.FC<Props> = ({ project, unit, unitPages, currentId }) => {
  const stats = unitStats(project);
  const siblings = project.units
    .filter((u) => u.id !== unit?.id)
    .sort((a, b) => Number(b.status === 'available') - Number(a.status === 'available') || a.floor - b.floor || a.code.localeCompare(b.code))
    .slice(0, 12);

  return (
    <section id="building" className="relative py-24 md:py-32 border-t border-white/[0.06]" aria-labelledby="building-heading">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
        <div className="eyebrow mb-7" data-reveal>
          Part of a project
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12" data-reveal>
          {/* Project card */}
          <Link
            to={projectHref(project, unit?.code)}
            id="building-project-link"
            className="lg:col-span-7 group relative block rounded-2xl overflow-hidden border border-white/10 min-h-[340px]"
          >
            {project.media.hero.url ? (
              <img
                src={project.media.hero.url}
                alt={project.media.hero.caption || project.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
              />
            ) : (
              <div className="absolute inset-0 bg-[#0c1220]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/55 to-[#070b14]/10" />
            <div className="relative h-full flex flex-col justify-end p-7 md:p-10 min-h-[340px]">
              <span className="mono-label !text-[#d1ad7a] flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> {CONSTRUCTION_LABELS[project.construction]} · {project.location.area}
              </span>
              <h2 id="building-heading" className="mt-3 font-display font-light text-4xl md:text-5xl leading-[1] text-[#f4efe6]">
                {project.titleBn || project.title}
              </h2>
              {project.titleBn && <div className="mt-2 text-sm text-slate-300">{project.title}</div>}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-mono tracking-[0.2em] uppercase text-slate-300">
                {project.core.totalFloors ? <span>{project.core.totalFloors} storeys</span> : null}
                {stats.total > 0 && (
                  <span>
                    {stats.available} of {stats.total} homes available
                  </span>
                )}
                <span className="text-gradient-gold">{priceLabel(project)}</span>
              </div>
              <span className="mt-7 inline-flex items-center gap-2 text-sm text-[#f1dfbd] group-hover:gap-3 transition-all">
                See the whole building <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* This home in the building + siblings */}
          <div className="lg:col-span-5 space-y-6">
            {unit && (
              <div className="panel p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mono-label">This home</div>
                    <div className="font-display font-light text-5xl leading-none mt-2">{unit.code}</div>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-[0.2em] uppercase border ${
                      unit.status === 'available' ? 'border-[#d1ad7a]/60 text-[#f1dfbd] bg-[#d1ad7a]/10' : 'border-white/10 text-slate-400'
                    }`}
                  >
                    {STATUS_LABEL[unit.status]}
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-3 text-sm text-slate-300">
                  <Layers className="w-4 h-4 text-[#d1ad7a]" />
                  {ordinal(unit.floor)} floor{project.core.totalFloors ? ` of ${project.core.totalFloors}` : ''}
                  {unit.facing ? ` · ${unit.facing} facing` : ''}
                </div>
              </div>
            )}

            {siblings.length > 0 && (
              <div className="panel p-7">
                <div className="mono-label mb-4">Other homes in this building</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {siblings.map((u) => {
                    const page = unitPages[u.id];
                    const to = page && page.id !== currentId ? `/property/${page.slug}` : projectHref(project, u.code);
                    return (
                      <Link
                        key={u.id}
                        to={to}
                        className="unit-cell flex items-center justify-center"
                        data-status={u.status}
                        aria-label={`Unit ${u.code}, ${STATUS_LABEL[u.status]}${u.price ? `, ${formatBdt(u.price)}` : ''}${page ? ', detailed page' : ''}`}
                        title={`${u.code} · ${STATUS_LABEL[u.status]}${u.price ? ` · ${formatBdt(u.price, { short: true })}` : ''}`}
                      >
                        {u.code}
                        {page && <span className="unit-page-dot" aria-hidden="true" />}
                      </Link>
                    );
                  })}
                </div>
                <p className="mt-4 text-[12px] text-slate-500 leading-relaxed">
                  Homes marked with a dot have their own page. The others open on the building view.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
