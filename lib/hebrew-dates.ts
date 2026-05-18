import { HDate, Locale, gematriya } from '@hebcal/core';

function toDate(input: Date | string): Date {
  return typeof input === 'string' ? new Date(input) : input;
}

function hebrewMonth(hd: HDate): string {
  return Locale.gettext(hd.getMonthName(), 'he-x-NoNikud');
}

export function formatHebrewDate(input: Date | string): string {
  const hd = new HDate(toDate(input));
  return `${gematriya(hd.getDate())} ב${hebrewMonth(hd)} ${gematriya(hd.getFullYear())}`;
}

export function formatHebrewDateTime(input: Date | string): string {
  const date = toDate(input);
  const time = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  return `${formatHebrewDate(date)}, ${time}`;
}
