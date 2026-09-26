import React from 'react';

interface RightSidebarSectionProps {
  title: string;
  /** Right-aligned secondary text in the header row (a city, a counter). */
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** A right-sidebar card: 14/700 title, 12px ink-3 meta, `surface` panel. */
const RightSidebarSection: React.FC<RightSidebarSectionProps> = ({ title, meta, children, className = '' }) => (
  <section className={`flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-4 ${className}`}>
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      {meta !== undefined && <span className="text-xs text-ink-3">{meta}</span>}
    </div>
    {children}
  </section>
);

export default RightSidebarSection;
