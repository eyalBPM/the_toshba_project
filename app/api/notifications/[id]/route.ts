import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { findNotificationById, deleteNotification } from '@/db/notification-repository';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const notification = await findNotificationById(id);
    if (!notification) return ApiErrors.notFound('Notification not found');
    if (notification.userId !== user.id) return ApiErrors.forbidden();

    await deleteNotification(id);
    return apiSuccess({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}
