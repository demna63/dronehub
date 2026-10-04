import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/useLanguage';

interface PageMetaProps {
  title?: string;
  description?: string;
}

/**
 * Keeps `document.title`, `<meta name="description">`, OpenGraph, Twitter cards,
 * canonical link, and html lang in step with the route.
 *
 * The route names are translation keys rather than Georgian literals, and `t`
 * is an effect dependency: the browser tab and metadata update when switching language.
 */
const ROUTE_TITLE_KEYS: Record<string, string> = {
  '': 'route_home',
  'popular': 'route_popular',
  'saved': 'route_saved',
  'u': 'route_user',
  'vlogs': 'route_vlogs',
  'blogs': 'route_vlogs',
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

const TOOL_TITLE_KEYS: Record<string, string> = {
  'battery-calc': 'tool_title_battery',
  'channel-tuner': 'tool_title_channel',
  'antenna-tuner': 'tool_title_antenna',
  'fresnel': 'tool_title_fresnel',
  'unlocker': 'tool_title_vtx',
  'harmonics': 'tool_title_harmonics',
  'stl': 'tool_title_stl',
  'zone-check': 'tool_title_zone',
  'converter': 'tool_title_rf',
  'fpv-range': 'tool_title_range',
};

const ROUTE_DESC_KEYS: Record<string, string> = {
  '': 'meta_desc_default',
  'market': 'meta_desc_market',
  'marketplace': 'meta_desc_market',
  'tools': 'meta_desc_tools',
  'map': 'meta_desc_map',
  'regulations': 'meta_desc_regulations',
  'vlogs': 'meta_desc_vlogs',
};

const TOOL_DESC_KEYS: Record<string, string> = {
  'fpv-range': 'meta_desc_range',
  'stl': 'meta_desc_stl',
};

const BASE_TITLE = 'DroneHub Georgia';

const PageMeta: React.FC<PageMetaProps> = ({ title, description }) => {
  const location = useLocation();
  const { t, language } = useLanguage();

  useEffect(() => {
    // 1. Sync language on html root element
    document.documentElement.lang = language === 'en' ? 'en' : 'ka';

    const segments = location.pathname.split('/').filter(Boolean);
    const firstSegment = segments[0] || '';
    const secondSegment = segments[1] || '';

    let pageTitle = '';
    let pageDesc = description || '';

    if (title) {
      pageTitle = `${title} | ${BASE_TITLE}`;
    } else if (firstSegment === '' || firstSegment === 'feed') {
      pageTitle = t('home_page_title');
      if (!pageDesc) pageDesc = t('meta_desc_default');
    } else if (firstSegment === 'tools' && secondSegment && TOOL_TITLE_KEYS[secondSegment]) {
      const toolTitleKey = TOOL_TITLE_KEYS[secondSegment];
      pageTitle = `${t(toolTitleKey)} | ${BASE_TITLE}`;
      if (!pageDesc && TOOL_DESC_KEYS[secondSegment]) {
        pageDesc = t(TOOL_DESC_KEYS[secondSegment]);
      } else if (!pageDesc) {
        pageDesc = t('meta_desc_tools');
      }
    } else {
      const key = ROUTE_TITLE_KEYS[firstSegment];
      const pageName = key
        ? t(key)
        : firstSegment
          ? firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
          : '';

      pageTitle = pageName ? `${pageName} | ${BASE_TITLE}` : t('home_page_title');
      if (!pageDesc && ROUTE_DESC_KEYS[firstSegment]) {
        pageDesc = t(ROUTE_DESC_KEYS[firstSegment]);
      }
    }

    if (!pageDesc) {
      pageDesc = t('meta_desc_default');
    }

    document.title = pageTitle;

    // 2. Meta tags sync for SEO and social crawlers
    const canonicalHref = `https://dronehub.ge${location.pathname === '/' ? '/' : location.pathname}`;

    const updateMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute(attr, value);
      }
    };

    updateMeta('meta[name="description"]', 'content', pageDesc);
    updateMeta('meta[property="og:title"]', 'content', pageTitle);
    updateMeta('meta[property="og:description"]', 'content', pageDesc);
    updateMeta('meta[property="og:url"]', 'content', canonicalHref);
    updateMeta('meta[name="twitter:title"]', 'content', pageTitle);
    updateMeta('meta[name="twitter:description"]', 'content', pageDesc);

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) {
      canonicalEl.setAttribute('href', canonicalHref);
    }
  }, [title, description, location.pathname, t, language]);

  return null;
};

export default PageMeta;
