import { requireRole } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { approveRevision } from '@/application/revision/approve-revision';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole('Admin', 'Senior');
    const { id: revisionId } = await params;

    await approveRevision({
      user: { id: user.id, status: user.status, role: user.role },
      revisionId,
    });

    return apiSuccess({ approved: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'FORBIDDEN') return ApiErrors.forbidden();
    if (msg === 'Revision not found') return ApiErrors.notFound('Revision not found');
    if (msg.includes('Only')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}
