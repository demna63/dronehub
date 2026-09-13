import { describe, expect, it } from 'vitest';
import { formatMonthYear, toDate, toYear } from './dates';

const JAN_2024 = new Date('2024-01-15T10:00:00Z');

describe('toDate', () => {
  it('reads a Firestore Timestamp', () => {
    const timestamp = { toDate: () => JAN_2024, seconds: JAN_2024.getTime() / 1000, nanoseconds: 0 };
    expect(toDate(timestamp)?.getTime()).toBe(JAN_2024.getTime());
  });

  it('reads a Timestamp that lost toDate crossing a JSON boundary', () => {
    expect(toDate({ seconds: 1705312800, nanoseconds: 0 })?.getFullYear()).toBe(2024);
  });

  it('reads ISO strings, millisecond numbers and Dates', () => {
    expect(toDate('2024-01-15T10:00:00Z')?.getTime()).toBe(JAN_2024.getTime());
    expect(toDate(JAN_2024.getTime())?.getTime()).toBe(JAN_2024.getTime());
    expect(toDate(JAN_2024)).toBe(JAN_2024);
  });

  it('returns null instead of an Invalid Date', () => {
    // This is the "Joined NaN" case: every one of these used to reach
    // `new Date(...).getFullYear()` and render NaN.
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
    expect(toDate('')).toBeNull();
    expect(toDate('not a date')).toBeNull();
    expect(toDate({} as never)).toBeNull();
    expect(toDate(new Date('nope'))).toBeNull();
  });

  it('survives a toDate() that throws', () => {
    expect(toDate({ toDate: () => { throw new Error('boom'); } })).toBeNull();
  });
});

describe('toYear / formatMonthYear', () => {
  it('never returns NaN', () => {
    expect(toYear({ seconds: 1705312800 })).toBe(2024);
    expect(toYear(undefined)).toBeNull();
    expect(formatMonthYear(undefined)).toBeNull();
    expect(formatMonthYear({ seconds: 1705312800 })).toContain('2024');
  });
});
