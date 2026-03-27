import { unstable_cache } from 'next/cache';
import { listSources, type DbSource } from '@/db/source-repository';

export const getCachedSources = unstable_cache(
  async (): Promise<DbSource[]> => {
    return listSources();
  },
  ['sources'],
  { tags: ['sources'] },
);

export { type DbSource };
