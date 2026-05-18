import { describe, it, expect } from 'vitest';
import { formatHebrewDate, formatHebrewDateTime } from '@/lib/hebrew-dates';

describe('formatHebrewDate', () => {
  it('converts a known Gregorian date to the expected Hebrew date', () => {
    expect(formatHebrewDate(new Date(2026, 4, 17))).toBe('א׳ בסיון תשפ״ו');
  });

  it('renders day 16 with gershayim as ט״ז (not יו)', () => {
    expect(formatHebrewDate(new Date(2026, 6, 1))).toBe('ט״ז בתמוז תשפ״ו');
  });

  it('handles Adar II in leap years', () => {
    expect(formatHebrewDate(new Date(2024, 2, 14))).toBe('ד׳ באדר ב׳ תשפ״ד');
  });

  it('accepts an ISO string equivalently to a Date', () => {
    const d = new Date(2026, 4, 17);
    expect(formatHebrewDate(d.toISOString())).toBe(formatHebrewDate(d));
  });
});

describe('formatHebrewDateTime', () => {
  it('appends a Latin-digit HH:MM after a comma', () => {
    const d = new Date(2026, 4, 17, 14, 32);
    expect(formatHebrewDateTime(d)).toBe('א׳ בסיון תשפ״ו, 14:32');
  });
});
