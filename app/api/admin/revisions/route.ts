import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { listPendingRevisions } from '@/db/revision-repository';
import { parsePaginationParams, toPaginated } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    await requireRole('Admin');
    const { cursor, limit } = parsePaginationParams(new URL(request.url));
    const revisions = await listPendingRevisions({ cursor, limit });
    return apiSuccess(toPaginated(revisions, limit));
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'FORBIDDEN') return ApiErrors.forbidden();
    return ApiErrors.internal();
  }
}
