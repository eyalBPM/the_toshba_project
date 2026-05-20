import { listSources, type DbSource } from '@/db/source-repository';

// In-process memory cache. We don't use Next.js `unstable_cache` because the
// serialized sources table exceeds its 2MB per-entry limit (table is ~10MB).
// One copy per server worker; cleared on POST /api/sources and via the admin
// reset endpoint.
let cached: DbSource[] | null = null;
let inFlight: Promise<DbSource[]> | null = null;

export async function getCachedSources(): Promise<DbSource[]> {
  if (cached) return cached;
  if (inFlight) return inFlight;
  inFlight = listSources().then((rows) => {
    cached = rows;
    inFlight = null;
    return rows;
  });
  return inFlight;
}

export function invalidateSourcesCache(): void {
  cached = null;
  inFlight = null;
}

export { type DbSource };
