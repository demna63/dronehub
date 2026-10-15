import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/useLanguage';
import { resolveRouteMeta } from '../utils/routeMeta';

interface PageMetaProps {
  title?: string;
  description?: string;
}

/**
 * Keeps `document.title`, `<meta name="description">`, OpenGraph, Twitter cards,
 * canonical link, and html lang in step with the route.
 *
 * Resolution lives in `utils/routeMeta` so the build-time prerender
 * (`build/seoPrerender.ts`) writes the same values into each page's raw HTML.
 * `t` is an effect dependency: metadata follows a language switch.
 */
const PageMeta: React.FC<PageMetaProps> = ({ title, description }) => {
  const location = useLocation();
  const { t, language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'ka';

    const meta = resolveRouteMeta(location.pathname, t, { title, description });
    document.title = meta.title;

    const updateMeta = (selector: string, attr: string, value: string) => {
      document.querySelector(selector)?.setAttribute(attr, value);
    };

    updateMeta('meta[name="description"]', 'content', meta.description);
    updateMeta('meta[property="og:title"]', 'content', meta.title);
    updateMeta('meta[property="og:description"]', 'content', meta.description);
    updateMeta('meta[property="og:url"]', 'content', meta.canonical);
    updateMeta('meta[name="twitter:title"]', 'content', meta.title);
    updateMeta('meta[name="twitter:description"]', 'content', meta.description);

    // The fallback shell (served for paths with no prerendered file) ships
    // without a canonical on purpose — a hardcoded one there declared every
    // unknown URL a duplicate of the homepage — so create it when missing.
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = meta.canonical;
  }, [title, description, location.pathname, t, language]);

  return null;
};

export default PageMeta;
