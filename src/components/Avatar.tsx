import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/useLanguage';

/**
 * The DroneHub "D" mark, inlined from public/brand/icon.svg.
 *
 * Inlined rather than referenced by URL on purpose: the fallback must be the
 * one thing that can never itself fail to load. A network request here would
 * mean the *fallback* could 404 offline or behind a cold cache, leaving an
 * empty circle — which is the failure it exists to prevent.
 */
const BrandMark: React.FC<{ title: string }> = ({ title }) => (
  <svg viewBox="0 0 512 512" role="img" aria-label={title} className="w-full h-full">
    <rect width="512" height="512" fill="#ffffff" />
    <path
      d="M 140 96 L 140 416 L 260 416 C 360 416 420 356 420 256 C 420 156 360 96 260 96 Z M 200 156 L 255 156 C 320 156 360 196 360 256 C 360 316 320 356 255 356 L 200 356 Z"
      fill="#1a365d"
    />
    <polygon points="140,220 175,256 140,292" fill="#0d9488" />
  </svg>
);

export interface AvatarProps {
  src?: string | null;
  /** Used for the accessible name; not drawn. */
  name?: string | null;
  /** Rendered box in px. The image is requested at this size. */
  size?: number;
  className?: string;
  /** Extra ring/border classes, e.g. `border-2 border-slate-900`. */
  ringClassName?: string;
}

/**
 * One avatar for every surface.
 *
 * Before this, each surface improvised: some fell back to a dicebear URL (a
 * third-party request on every render for a user who simply has no picture),
 * some to an initial, some to nothing, and none of them handled an `src` that
 * 404s — a deleted storage object left an empty circle with alt text bleeding
 * through it. Here a broken load is caught once and degrades to the brand mark,
 * so a person without a photo is a DroneHub "D" everywhere in the app.
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 40,
  className = '',
  ringClassName = '',
}) => {
  const { t } = useLanguage();
  const [hasFailed, setHasFailed] = useState(false);

  // A new src deserves a fresh attempt; without this, one broken image would
  // pin the component to the fallback for the rest of its life.
  useEffect(() => { setHasFailed(false); }, [src]);

  const showImage = Boolean(src) && !hasFailed;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden bg-slate-800 ${ringClassName} ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={src as string}
          alt={name || ''}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setHasFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <BrandMark title={name || t('route_user')} />
      )}
    </span>
  );
};

/** Memoised: these render once per feed card, so an unrelated Feed state
    change used to re-render all of them. */
export default React.memo(Avatar);
