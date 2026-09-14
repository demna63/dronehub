import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, Eye, Loader2, Wrench, Zap } from 'lucide-react';
import type { PostRatings, PostTelemetryVote } from '../types';
import StarRating from './StarRating';
import { useLanguage } from '../contexts/useLanguage';
import {
  MIN_VOTES_FOR_VERDICT,
  percentToStars,
  starsToPercent,
  telemetryAverages,
  telemetryDisplay,
  voteStars,
} from '../utils/telemetry';

export interface PostTelemetryProps {
  stats: PostRatings;
  /** Rejects to signal the rating was not saved; the caller rolls back. */
  onRate: (ratings: PostTelemetryVote) => Promise<void>;
  /** The caller's own rating, or null when they have not rated. */
  currentUserVote: PostTelemetryVote | null;
  /** True while the caller's existing vote is still being fetched. */
  isLoadingVote?: boolean;
  /** False when nobody is signed in: opening asks them to log in instead. */
  canRate?: boolean;
  onRequireLogin?: () => void;
  /** Render already expanded. */
  defaultOpen?: boolean;
}

/** Translation keys, resolved at render time — see the note on Feed's SORT_OPTIONS. */
const AXES = [
  { key: 'utility', labelKey: 'rating_axis_utility', icon: Wrench },
  { key: 'skill', labelKey: 'rating_axis_skill', icon: Zap },
  { key: 'vision', labelKey: 'rating_axis_vision', icon: Eye },
] as const;

const NOT_RATED: PostTelemetryVote = { utility: 0, skill: 0, vision: 0 };

/**
 * The whole rating control for a post: one summary line that expands into three
 * five-star rows.
 *
 * Design notes worth keeping:
 * - One widget, one number. The previous version showed the same data three
 *   times (a battery, three per-axis bars, and a collapsed score bar) and none
 *   of them agreed at a glance.
 * - Stars, not sliders. A 0-100 slider invites precision nobody has and is
 *   miserable on a phone; five taps carry the same signal.
 * - Nothing is preselected. The old panel opened at 50% on every axis, so a
 *   distracted tap on "save" submitted a neutral rating the person never chose.
 * - The headline is the Bayesian score (see utils/telemetry.ts) and is withheld
 *   entirely below MIN_VOTES_FOR_VERDICT: one person's opinion must not be
 *   dressed up in the same visual language as a forty-person consensus.
 */
const PostTelemetry: React.FC<PostTelemetryProps> = ({
  stats,
  onRate,
  currentUserVote,
  isLoadingVote = false,
  canRate = true,
  onRequireLogin,
  defaultOpen = false,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<PostTelemetryVote>(currentUserVote ?? NOT_RATED);

  // Follow the server's copy of the caller's vote as it arrives or changes.
  useEffect(() => {
    setInputs(currentUserVote ?? NOT_RATED);
  }, [currentUserVote]);

  const { stars: overallStars, isConfirmed, hasAny, count } = telemetryDisplay(stats);
  const averages = telemetryAverages(stats);
  const hasVoted = currentUserVote !== null;
  const ownStars = voteStars(currentUserVote);
  const isComplete = AXES.every((axis) => inputs[axis.key] > 0);

  const toggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isOpen && !canRate) {
      onRequireLogin?.();
      return;
    }
    setIsOpen((open) => !open);
  };

  const handleSubmit = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isSaving || !isComplete) return;

    setIsSaving(true);
    setError(null);
    try {
      await onRate(inputs);
      setIsOpen(false);
    } catch (err) {
      // Keep the panel open so the choices are not lost, and say what actually
      // failed instead of silently showing a rating the server rejected.
      // The service reports a translation key; `t` falls back to the key itself
      // if it is ever unknown, which is visible rather than silent.
      setError(t(err instanceof Error && err.message ? err.message : 'rating_save_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-w-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={
          hasAny
            ? t(isConfirmed ? 'rating_aria_confirmed' : 'rating_aria_provisional', {
                stars: overallStars.toFixed(1),
                count,
              })
            : t('rating_none_yet')
        }
        className={`w-full h-10 px-3 rounded-xl border flex items-center gap-2 transition-all ${
          isOpen
            ? 'bg-slate-900 border-white/20'
            : 'bg-white/[0.03] border-white/5 hover:border-white/15 hover:bg-white/[0.06]'
        }`}
      >
        <StarRating
          value={overallStars}
          label={t('rating_average')}
          size={14}
          tone={isConfirmed ? 'gold' : 'muted'}
        />

        <span className={`text-xs font-bold tabular-nums ${isConfirmed ? 'text-white' : 'text-slate-300'}`}>
          {hasAny ? overallStars.toFixed(1) : '–'}
        </span>

        {/* A number backed by one or two people is still shown — hiding it read
            as "my rating did not save" — but it is labelled provisional and
            drawn in a muted tone so it is never mistaken for a consensus. */}
        <span className="text-[10px] text-slate-400 truncate">
          {!hasAny
            ? t('rating_none_yet')
            : isConfirmed
              ? t('rating_count', { count })
              : t('rating_provisional_count', { count, min: MIN_VOTES_FOR_VERDICT })}
        </span>

        <span className="flex-1" />

        {hasVoted && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 shrink-0 tabular-nums">
            <Check size={11} aria-hidden="true" /> შენი {ownStars.toFixed(1)}
          </span>
        )}

        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="mt-2 bg-slate-950 border border-white/10 rounded-xl p-3 animate-in slide-in-from-top-1 fade-in duration-200"
        >
          {isLoadingVote ? (
            <p className="text-[11px] text-slate-500 py-6 text-center">{t('state_loading')}</p>
          ) : (
            <>
              <div className="space-y-2.5">
                {AXES.map((axis) => (
                  <div key={axis.key} className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 w-[86px] shrink-0">
                      <axis.icon size={12} className="text-slate-500" aria-hidden="true" />
                      {t(axis.labelKey)}
                    </span>

                    <StarRating
                      value={percentToStars(inputs[axis.key])}
                      onChange={(starValue) =>
                        setInputs((prev) => ({ ...prev, [axis.key]: starsToPercent(starValue) }))
                      }
                      disabled={isSaving}
                      label={t(axis.labelKey)}
                      size={18}
                    />

                    <span className="flex-1" />

                    {/* The community's own average per axis, so a rater can
                        see where they sit without leaving the panel. */}
                    {hasAny && (
                      <span
                        title={t(isConfirmed ? 'rating_community_average' : 'rating_provisional_average')}
                        className={`text-[10px] tabular-nums shrink-0 ${isConfirmed ? 'text-slate-400' : 'text-slate-600'}`}
                      >
                        {percentToStars(averages[axis.key]).toFixed(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <p role="alert" className="mt-3 text-[10px] text-rose-400 text-center">{error}</p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving || !isComplete}
                className="w-full mt-3 h-8 rounded-lg bg-amber-400 text-black text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-amber-300 transition-colors disabled:bg-slate-800 disabled:text-slate-500"
              >
                {isSaving
                  ? <><Loader2 size={12} className="animate-spin" /> {t('action_saving')}</>
                  : isComplete
                    ? <><Check size={12} /> {t(hasVoted ? 'action_update' : 'action_save')}</>
                    : t('rating_rate_all_three')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostTelemetry;
