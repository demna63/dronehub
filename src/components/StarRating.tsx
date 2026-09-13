import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { RATING_STARS } from '../utils/telemetry';

const INDEXES = Array.from({ length: RATING_STARS }, (_, index) => index);

interface StarRatingProps {
  /** 0..5. Fractional values are drawn as a partially filled star. */
  value: number;
  /** Omit to render read-only. Receives 1..5. */
  onChange?: (stars: number) => void;
  size?: number;
  disabled?: boolean;
  /** Accessible name for the group, e.g. the axis label. */
  label: string;
  /** `muted` marks a provisional value — one that too few people have set. */
  tone?: 'gold' | 'muted';
  className?: string;
}

/**
 * Five stars, read-only or tappable.
 *
 * Read-only mode clips a filled row over an empty one rather than rounding to
 * whole stars, so a 4.2 average is visibly not a 4.8. Interactive mode is five
 * real buttons — tab and Enter work without any key handling of our own.
 */
const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  size = 16,
  disabled = false,
  label,
  tone = 'gold',
  className = '',
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const isInteractive = Boolean(onChange) && !disabled;

  if (!isInteractive) {
    const fillPercent = Math.max(0, Math.min(100, (value / RATING_STARS) * 100));
    const fillColor = tone === 'muted' ? 'text-slate-400' : 'text-amber-400';
    return (
      <span
        role="img"
        aria-label={`${label}: ${value.toFixed(1)} / ${RATING_STARS}`}
        className={`relative inline-flex leading-none shrink-0 ${className}`}
      >
        <span className="flex gap-0.5 text-slate-700">
          {INDEXES.map((index) => <Star key={index} size={size} fill="currentColor" strokeWidth={0} />)}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${fillPercent}%` }}
        >
          <span className={`flex gap-0.5 ${fillColor}`}>
            {INDEXES.map((index) => <Star key={index} size={size} fill="currentColor" strokeWidth={0} />)}
          </span>
        </span>
      </span>
    );
  }

  const shown = hovered ?? value;

  return (
    <span className={`inline-flex gap-0.5 ${className}`} onMouseLeave={() => setHovered(null)}>
      {INDEXES.map((index) => {
        const stars = index + 1;
        const isLit = stars <= shown;
        return (
          <button
            key={index}
            type="button"
            disabled={disabled}
            aria-label={`${label}: ${stars} / ${RATING_STARS}`}
            aria-pressed={stars <= value}
            onMouseEnter={() => setHovered(stars)}
            onFocus={() => setHovered(stars)}
            onBlur={() => setHovered(null)}
            onClick={(event) => {
              event.stopPropagation();
              onChange?.(stars);
            }}
            className={`p-0.5 rounded transition-transform hover:scale-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 ${
              isLit ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400/60'
            }`}
          >
            <Star size={size} fill="currentColor" strokeWidth={0} />
          </button>
        );
      })}
    </span>
  );
};

export default StarRating;
