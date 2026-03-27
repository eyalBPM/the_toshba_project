import { transliterate } from 'hebrew-transliteration';

/**
 * Generates a URL-safe slug from a Hebrew title.
 * Transliterates, lowercases, strips diacritics, and normalizes to hyphens.
 */
export function generateSlug(title: string): string {
  const transliterated = transliterate(title);
  return transliterated
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritical marks
    .replace(/[ʾʿ]/g, '') // strip alef/ayin markers
    .replace(/[^a-z0-9]+/g, '-') // non-alphanum to hyphen
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-|-$/g, ''); // trim leading/trailing hyphens
}

/**
 * Resolves slug conflicts by appending -2, -3, etc.
 */
export function resolveSlugConflict(baseSlug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }
  let suffix = 2;
  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix++;
  }
  return `${baseSlug}-${suffix}`;
}
