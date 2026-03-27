import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { listNotificationsByUser, countUnreadByUser } from '@/db/notification-repository';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10) || 20, 100);

    const [notifications, unreadCount] = await Promise.all([
      listNotificationsByUser(user.id, { unreadOnly, cursor, limit }),
      countUnreadByUser(user.id),
    ]);

    const hasMore = notifications.length === limit;
    const nextCursor = hasMore && notifications.length > 0
      ? notifications[notifications.length - 1].id
      : null;

    return apiSuccess({ notifications, unreadCount, nextCursor });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}
