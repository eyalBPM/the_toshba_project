import { listDistinctBooks } from '@/db/source-repository';

// In-process memory cache of the distinct Source.book values. Cleared
// whenever sources-cache is cleared (i.e., POST /api/sources or the admin
// reset endpoint), since adding sources can introduce a new book.
let cached: string[] | null = null;
let inFlight: Promise<string[]> | null = null;

export async function getCachedBooks(): Promise<string[]> {
  if (cached) return cached;
  if (inFlight) return inFlight;
  inFlight = listDistinctBooks().then((rows) => {
    cached = rows;
    inFlight = null;
    return rows;
  });
  return inFlight;
}

export function invalidateBooksCache(): void {
  cached = null;
  inFlight = null;
}
