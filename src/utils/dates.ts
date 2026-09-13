/**
 * dates.ts — one place that turns "whatever a timestamp field happens to hold"
 * into a real Date.
 *
 * Firestore hands back a `Timestamp` ({seconds, nanoseconds} with a `toDate()`),
 * but the same field can also hold an ISO string written by an optimistic
 * client update, a millisecond number, or an already-hydrated Date. Passing a
 * Timestamp straight to `new Date(...)` yields an Invalid Date, which is how
 * profiles ended up reading "Joined NaN".
 */

/** Anything that has plausibly been stored in a timestamp field. */
export type TimestampLike =
  | Date
  | string
  | number
  | { toDate: () => Date }
  | { seconds: number; nanoseconds?: number }
  | null
  | undefined;

const isValid = (date: Date): boolean => !Number.isNaN(date.getTime());

/** Coerce a stored timestamp to a Date, or null when it cannot be read. */
export const toDate = (value: TimestampLike): Date | null => {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) return isValid(value) ? value : null;

  if (typeof value === 'object') {
    if ('toDate' in value && typeof value.toDate === 'function') {
      try {
        const converted = value.toDate();
        return converted instanceof Date && isValid(converted) ? converted : null;
      } catch {
        return null;
      }
    }
    // A Timestamp that crossed a JSON boundary keeps the fields but loses toDate.
    if ('seconds' in value && typeof value.seconds === 'number') {
      const converted = new Date(value.seconds * 1000);
      return isValid(converted) ? converted : null;
    }
    return null;
  }

  const converted = new Date(value);
  return isValid(converted) ? converted : null;
};

/** Four-digit year, or null when the timestamp is unreadable. */
export const toYear = (value: TimestampLike): number | null => toDate(value)?.getFullYear() ?? null;

/**
 * Month and year in Georgian, e.g. "სექტემბერი 2026". Returns null rather than
 * a placeholder so the caller decides what to render when the date is missing.
 */
export const formatMonthYear = (value: TimestampLike): string | null => {
  const date = toDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat('ka-GE', { month: 'long', year: 'numeric' }).format(date);
};

/** Hour:minute in Georgian locale, or '' when the timestamp is unreadable. */
export const formatClockTime = (value: TimestampLike): string => {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });
};

/** Short date in Georgian locale, or '' when the timestamp is unreadable. */
export const formatShortDate = (value: TimestampLike): string => {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleDateString('ka-GE');
};
