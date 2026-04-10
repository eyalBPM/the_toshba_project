import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { checkEditFreshness } from '@/application/revision/check-edit-freshness';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id: revisionId } = await params;

    const result = await checkEditFreshness({
      user: { id: user.id, status: user.status, role: user.role },
      revisionId,
    });

    return apiSuccess(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}
