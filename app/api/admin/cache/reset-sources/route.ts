import { invalidateSourcesCache } from '@/lib/sources-cache';
import { invalidateBooksCache } from '@/lib/books-cache';
import { requireRole } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';

export async function POST() {
  try {
    await requireRole('Admin');
    invalidateSourcesCache();
    invalidateBooksCache();
    return apiSuccess({ reset: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'FORBIDDEN') return ApiErrors.forbidden();
    return ApiErrors.internal();
  }
}
