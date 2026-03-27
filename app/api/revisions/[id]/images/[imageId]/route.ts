import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { deleteUserImage } from '@/application/image/delete-image';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    const user = await requireAuth();
    const { imageId } = await params;

    await deleteUserImage({
      user: { id: user.id, status: user.status, role: user.role },
      imageId,
    });

    return apiSuccess({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Image not found') return ApiErrors.notFound(msg);
    if (msg.includes('Only')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}
