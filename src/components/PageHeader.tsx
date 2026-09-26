import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned control (primary action, segmented sort), bottom-aligned. */
  action?: React.ReactNode;
  /**
   * `page` is the 26px default. `panel` (22px) is for the map's side panel,
   * `inline` (20px) for a header that shares its row with tabs, as in chat.
   */
  size?: 'page' | 'panel' | 'inline';
  className?: string;
}

const TITLE_SIZE: Record<NonNullable<PageHeaderProps['size']>, string> = {
  page: 'text-[26px]',
  panel: 'text-[22px]',
  inline: 'text-xl',
};

const SUBTITLE_SIZE: Record<NonNullable<PageHeaderProps['size']>, string> = {
  page: 'text-sm',
  panel: 'text-[13px]',
  inline: 'text-[13px]',
};

/**
 * The one page heading (F19).
 *
 * Before this each page invented its own: an italic uppercase h1 on tools,
 * a sr-only h1 on the feed, none on the market. It owns the page's `<h1>`.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, size = 'page', className = '' }) => (
  <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
    <div className="flex min-w-0 flex-col gap-1">
      <h1 className={`${TITLE_SIZE[size]} font-extrabold leading-tight text-ink`}>{title}</h1>
      {subtitle && <p className={`${SUBTITLE_SIZE[size]} text-ink-3`}>{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default PageHeader;
