import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import { ECOSYSTEM_LINKS, EcosystemSiteId } from '../config/ecosystemLinks';
import { SIDEBAR_ROW, SIDEBAR_ROW_IDLE } from '../constants/navigation';

interface EcosystemLinksNavProps {
  /** This site. Its own row is omitted — a link to where you already are is noise. */
  currentSiteId: EcosystemSiteId;
  onNavigate?: () => void;
  variant?: 'sidebar' | 'mobile';
}

/**
 * Links to the sister sites (PID calculator, VTX generator).
 *
 * Renders rows only; the caller supplies the section heading so the links can
 * sit under "Ecosystem" on desktop and under "Information" in the mobile menu.
 */
const EcosystemLinksNav: React.FC<EcosystemLinksNavProps> = ({
  currentSiteId,
  onNavigate,
  variant = 'sidebar',
}) => {
  const { t } = useLanguage();
  const rowClass = variant === 'mobile'
    ? 'flex min-h-11 items-center justify-between border-b border-line text-[15px] text-ink-2'
    : `${SIDEBAR_ROW} ${SIDEBAR_ROW_IDLE} justify-between`;

  return (
    <>
      {ECOSYSTEM_LINKS.filter((link) => link.id !== currentSiteId).map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onNavigate?.()}
          className={rowClass}
        >
          <span className="truncate">{t(link.labelKey)}</span>
          <ExternalLink size={14} aria-hidden="true" className="shrink-0 text-ink-3" />
          <span className="sr-only">{t('link_opens_new_tab')}</span>
        </a>
      ))}
    </>
  );
};

export default EcosystemLinksNav;
