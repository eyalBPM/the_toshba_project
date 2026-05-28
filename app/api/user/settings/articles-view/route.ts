import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { getArticlesViewBundle } from '@/application/table-views/manage-table-views';

export async function GET() {
  try {
    const user = await requireAuth();
    const bundle = await getArticlesViewBundle(user.id);
    return apiSuccess(bundle);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}
