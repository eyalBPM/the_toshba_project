import { requireRole } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { approveImage } from '@/application/image/approve-image';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole('Admin');
    const { id } = await params;

    await approveImage({
      actingUser: { id: user.id, status: user.status, role: user.role },
      imageId: id,
    });

    return apiSuccess({ approved: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'FORBIDDEN') return ApiErrors.forbidden();
    if (msg === 'Image not found') return ApiErrors.notFound(msg);
    if (msg.includes('not pending')) return ApiErrors.badRequest(msg);
    return ApiErrors.internal();
  }
}
