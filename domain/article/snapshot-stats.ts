/**
 * Helpers that derive denormalized Article-level fields from a snapshot's
 * sourcesSnapshot JSON. Kept pure / framework-free so callers in the
 * application layer can use them inside transactions.
 */

interface MaybeSourceEntry {
  index?: number;
  book?: string;
}

export function extractMinSourceIndex(sourcesSnapshot: unknown): number | null {
  if (!Array.isArray(sourcesSnapshot)) return null;
  let min: number | null = null;
  for (const raw of sourcesSnapshot) {
    if (!raw || typeof raw !== 'object') continue;
    const idx = (raw as MaybeSourceEntry).index;
    if (typeof idx !== 'number') continue;
    if (min === null || idx < min) min = idx;
  }
  return min;
}
