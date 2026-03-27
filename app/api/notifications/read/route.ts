import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { markAsRead, markAllAsRead, findNotificationById } from '@/db/notification-repository';

const readSchema = z.object({
  notificationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = readSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    if (parsed.data.notificationId) {
      // Mark single notification as read (verify ownership)
      const notification = await findNotificationById(parsed.data.notificationId);
      if (!notification) return ApiErrors.notFound('Notification not found');
      if (notification.userId !== user.id) return ApiErrors.forbidden();
      await markAsRead(parsed.data.notificationId);
    } else {
      // Mark all as read
      await markAllAsRead(user.id);
    }

    return apiSuccess({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}
