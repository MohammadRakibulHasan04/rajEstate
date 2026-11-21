import React from 'react';

/** Consistent wrapper for every block in the main column of the detail page. */
export const PageSection: React.FC<{
  id: string;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}> = ({ id, title, aside, children }) => (
  <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28 pt-12 mt-12 border-t border-[#181512]/[0.09]" data-reveal>
    <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
      <h2 id={`${id}-heading`} className="font-display text-2xl md:text-3xl leading-[1.25] text-[#181512]">
        {title}
      </h2>
      {aside}
    </div>
    {children}
  </section>
);

/** Two-column definition list used for details and specifications. */
export const DetailList: React.FC<{ items: { key: string; label: string; value: string }[] }> = ({ items }) => (
  <dl className="grid sm:grid-cols-2 gap-x-10">
    {items.map((it) => (
      <div key={it.key} className="flex items-baseline justify-between gap-6 py-3.5 border-b border-[#181512]/[0.08]">
        <dt className="text-[13px] text-[#6E6559] shrink-0">{it.label}</dt>
        <dd className="text-sm text-[#181512] font-medium text-right">{it.value}</dd>
      </div>
    ))}
  </dl>
);
