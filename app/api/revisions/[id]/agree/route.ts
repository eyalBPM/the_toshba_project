import { requireVerified } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { createAgreement } from '@/application/agreement/create-agreement';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireVerified();
    const { id: revisionId } = await params;

    const result = await createAgreement({
      user: { id: user.id, status: user.status, role: user.role },
      userName: user.name,
      revisionId,
    });

    return apiSuccess(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'FORBIDDEN') return ApiErrors.forbidden();
    if (msg === 'Revision not found') return ApiErrors.notFound('Revision not found');
    if (msg === 'CONFLICT') return ApiErrors.conflict('Already agreed');
    if (msg.includes('cannot agree') || msg.includes('Only')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}
