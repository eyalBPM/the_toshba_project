// Map Hebrew punctuation marks (gershayim ״ U+05F4 and geresh ׳ U+05F3) to
// their ASCII equivalents (" and ') so search matches regardless of which
// variant the user typed.
const GERSHAYIM = /״/g;
const GERESH = /׳/g;

export function normalizeHebrewPunctuation(text: string): string {
  return text.replace(GERSHAYIM, '"').replace(GERESH, "'");
}
