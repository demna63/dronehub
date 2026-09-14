import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/useLanguage';

interface PageMetaProps {
  title?: string;
}

/**
 * Keeps `document.title` in step with the route.
 *
 * The route names are translation keys rather than Georgian literals, and `t`
 * is an effect dependency: the browser tab is part of the UI, so switching the
 * language has to retitle it too.
 */
const ROUTE_TITLE_KEYS: Record<string, string> = {
  '': 'route_home',
  'popular': 'route_popular',
  'saved': 'route_saved',
  'u': 'route_user',
  'vlogs': 'route_vlogs',
  'chat': 'route_chat',
  'regulations': 'route_regulations',
  'marketplace': 'route_market',
  'market': 'route_market',
  'community': 'route_community',
  'tools': 'route_tools',
  'search': 'route_search',
  'map': 'route_map',
  'c': 'route_category',
  'category': 'route_category',
};

const BASE_TITLE = 'Dronehub';

const PageMeta: React.FC<PageMetaProps> = ({ title }) => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    if (title) {
      document.title = `${title} | ${BASE_TITLE}`;
      return;
    }

    const firstSegment = location.pathname.split('/')[1] || '';
    const key = ROUTE_TITLE_KEYS[firstSegment];
    // An unmapped segment is still better than nothing: capitalise it rather
    // than falling back to the bare site name.
    const pageName = key
      ? t(key)
      : firstSegment
        ? firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
        : '';

    document.title = pageName
      ? `${pageName} | ${BASE_TITLE}`
      : `${BASE_TITLE} — ${t('site_tagline')}`;
  }, [title, location, t]);

  return null;
};

export default PageMeta;
