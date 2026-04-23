import { requireRole } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { approveMinorChange } from '@/application/minor-change/approve-minor-change';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  try {
    const user = await requireRole('Admin', 'Senior', 'Moderator');
    const { requestId } = await params;

    await approveMinorChange({
      actingUser: { id: user.id, status: user.status, role: user.role },
      requestId,
    });

    return apiSuccess({ approved: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'FORBIDDEN') return ApiErrors.forbidden();
    if (msg === 'Minor change request not found') return ApiErrors.notFound(msg);
    if (msg.includes('Only') || msg.includes('Cannot transition')) {
      return ApiErrors.badRequest(msg);
    }
    return ApiErrors.internal();
  }
}
