import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import {
  ECOSYSTEM_LINKS,
  EcosystemSiteId,
  isExternalEcosystemUrl,
} from '../config/ecosystemLinks';

interface EcosystemLinksNavProps {
  currentSiteId: EcosystemSiteId;
  onNavigate?: () => void;
  variant?: 'sidebar' | 'mobile';
}

const EcosystemLinksNav: React.FC<EcosystemLinksNavProps> = ({
  currentSiteId,
  onNavigate,
  variant = 'sidebar',
}) => {
  const { t } = useLanguage();
  const isMobile = variant === 'mobile';

  return (
    <div className={isMobile ? 'space-y-2' : 'space-y-1'}>
      <div className={isMobile ? 'px-1 mb-3' : 'px-3 mb-2'}>
        <h3
          className={`font-black uppercase tracking-widest text-sky-400/90 ${
            isMobile ? 'text-xs' : 'text-[10px]'
          }`}
        >
          {t('eco_section') || t('route_tools_short')}
        </h3>
      </div>

      <nav className={isMobile ? 'space-y-2' : 'space-y-1'} aria-label={t('eco_section') || t('route_tools_short')}>
        {ECOSYSTEM_LINKS.map((link) => {
          const isCurrent = link.id === currentSiteId;
          const Icon = link.icon;
          const label = t(link.labelKey) || link.labelFallback;
          const isExternal = isExternalEcosystemUrl(link.url) && !isCurrent;
          const rowClass = `
                flex items-center justify-between rounded-xl transition-all duration-200 group
                ${isMobile ? 'px-4 py-4 text-lg' : 'px-3 py-2.5 text-sm'}
                ${
                  isCurrent
                    ? 'bg-sky-500/15 text-sky-300 font-bold ring-1 ring-sky-400/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 font-medium'
                }
              `;
          const trailing = (
            <span className="flex items-center gap-2 shrink-0 ml-2">
              {isCurrent && (
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/20">
                  {t('eco_current') || t('eco_current_label')}
                </span>
              )}
              {isExternal && (
                <ExternalLink
                  size={isMobile ? 16 : 14}
                  className="opacity-50 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                />
              )}
            </span>
          );
          const leading = (
            <span className="flex items-center gap-3 min-w-0">
              <Icon
                size={isMobile ? 22 : 18}
                className={`shrink-0 ${isCurrent ? 'text-sky-400' : 'group-hover:scale-110 transition-transform'}`}
              />
              <span className="truncate">{label}</span>
            </span>
          );

          if (isCurrent) {
            return (
              <div key={link.id} className={rowClass} aria-current="page">
                {leading}
                {trailing}
              </div>
            );
          }

          return (
            <a
              key={link.id}
              href={link.url}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              onClick={() => onNavigate?.()}
              className={rowClass}
            >
              {leading}
              {trailing}
            </a>
          );
        })}
      </nav>
    </div>
  );
};

export default EcosystemLinksNav;
