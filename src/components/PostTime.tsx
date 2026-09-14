import React from 'react';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ka } from 'date-fns/locale';
import { useLanguage } from '../contexts/useLanguage';
import { toDate, type TimestampLike } from '../utils/dates';

const LOCALES = { ka, en: enUS } as const;

interface PostTimeProps {
  value: TimestampLike;
  /** Draw the clock icon alongside. */
  withIcon?: boolean;
  className?: string;
}

/**
 * When a post was published, as "3 days ago", in the reader's language.
 *
 * The one place this is computed. PostCard used to render `post.timestamp`, a
 * field nothing writes — `addPost` has never set it — so it fell through to
 * "just now" for every post regardless of age, and a three-day-old post on a
 * profile or in search results claimed to be new. PostCardHeader meanwhile did
 * the right thing with date-fns, so the feed and the profile disagreed about
 * the same post.
 *
 * A missing or unreadable date renders NOTHING rather than "just now".
 * Inventing a plausible timestamp is the same failure as the old
 * `|| currentYear` that produced "Joined NaN": it does not look broken, so
 * nobody reports it.
 *
 * The locale follows the language. Hardcoding `ka` left English readers with
 * Georgian relative times.
 */
export const PostTime: React.FC<PostTimeProps> = ({ value, withIcon = true, className = '' }) => {
  const { language } = useLanguage();
  const date = toDate(value);
  if (!date) return null;

  return (
    <span className={`flex items-center gap-1 ${className}`}>
      {withIcon && <Clock size={12} aria-hidden="true" />}
      {/* A machine-readable timestamp next to the human one. */}
      <time dateTime={date.toISOString()}>
        {formatDistanceToNow(date, { addSuffix: true, locale: LOCALES[language] })}
      </time>
    </span>
  );
};

export default PostTime;
