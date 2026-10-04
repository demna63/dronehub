import React from 'react';

interface LogoProps {
  className?: string;
  /** Mark only, without the wordmark. */
  iconOnly?: boolean;
}

/**
 * The DroneHub mark plus a text wordmark (F3).
 *
 * The old logo was a 144×40 white box around a raster made for a light
 * ground, with a hover glow. The mark is the square `icon.svg`, which already
 * carries its own navy ground, so it sits on the dark UI without a plate. The
 * wordmark is live text: it stays sharp at any zoom and costs no request.
 */
const Logo: React.FC<LogoProps> = ({ className = '', iconOnly = false }) => {
  if (iconOnly) {
    return (
      <img
        src="/brand/icon.svg"
        alt="DroneHub Georgia"
        width={32}
        height={32}
        decoding="async"
        className={`w-8 h-8 rounded-lg shrink-0 ${className}`}
      />
    );
  }

  return (
    <span className={`inline-flex items-center shrink-0 ${className}`}>
      <picture className="inline-flex items-center">
        <source srcSet="/brand/dronehub-lockup.webp" type="image/webp" />
        <img
          src="/brand/dronehub-lockup.png"
          alt="DroneHub Georgia"
          width={146}
          height={36}
          decoding="async"
          className="h-9 w-auto max-w-[170px] object-contain shrink-0"
        />
      </picture>
    </span>
  );
};

export default Logo;
