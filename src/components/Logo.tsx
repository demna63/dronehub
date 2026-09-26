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
const Logo: React.FC<LogoProps> = ({ className = '', iconOnly = false }) => (
  <span className={`flex items-center gap-2 ${className}`}>
    <img
      src="/brand/icon.svg"
      alt=""
      width={32}
      height={32}
      decoding="async"
      className="w-8 h-8 rounded-lg shrink-0"
    />
    {!iconOnly && (
      <span className="text-base font-extrabold text-ink leading-none whitespace-nowrap">DroneHub</span>
    )}
  </span>
);

export default Logo;
