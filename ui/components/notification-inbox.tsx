'use client';

import { useRouter } from 'next/navigation';
import { getNotificationLink } from '@/lib/notification-links';
import { InfiniteScrollTrigger } from './infinite-scroll-trigger';
import {
  useMarkNotificationsRead,
  useNotificationsList,
  useUnreadNotificationsCount,
  type NotificationItem,
} from '@/ui/hooks/use-notifications';

interface NotificationInboxProps {
  initialNotifications: NotificationItem[];
}

export function NotificationInbox({ initialNotifications }: NotificationInboxProps) {
  const router = useRouter();

  const initialPage = {
    notifications: initialNotifications,
    unreadCount: initialNotifications.filter((n) => !n.read).length,
    nextCursor:
      initialNotifications.length >= 20
        ? initialNotifications[initialNotifications.length - 1].id
        : null,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useNotificationsList(initialPage);
  const markRead = useMarkNotificationsRead();
  const { data: serverUnreadCount } = useUnreadNotificationsCount();

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markingAll = markRead.isPending && markRead.variables === undefined;
  const newCount =
    typeof serverUnreadCount === 'number' ? Math.max(0, serverUnreadCount - unreadCount) : 0;

  function handleClick(notification: NotificationItem) {
    const link = getNotificationLink(notification.entityType, notification.entityId);
    if (!notification.read) markRead.mutate(notification.id);
    if (link) router.push(link);
  }

  return (
    <div className="space-y-3" dir="rtl">
      {newCount > 0 && (
        <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            {newCount === 1
              ? 'יש התראה חדשה — רענן כדי לצפות בה'
              : `יש ${newCount} התראות חדשות — רענן כדי לצפות בהן`}
          </p>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-sm font-medium text-amber-800 hover:underline disabled:opacity-50"
            type="button"
          >
            {isRefetching ? 'מרענן...' : 'רענן'}
          </button>
        </div>
      )}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{unreadCount} התראות שלא נקראו</p>
          <button
            onClick={() => markRead.mutate(undefined)}
            disabled={markingAll}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            {markingAll ? 'מסמן...' : 'סמן הכל כנקרא'}
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <p className="text-gray-400">אין התראות.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const link = getNotificationLink(n.entityType, n.entityId);
            const hasLink = link !== null;
            return (
              <li
                key={n.id}
                className={`flex items-start gap-2 rounded-md border p-3 transition-colors ${
                  n.read
                    ? 'border-gray-200 bg-gray-50 text-gray-500 opacity-75'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                {!n.read && (
                  <span
                    aria-hidden="true"
                    className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-blue-500"
                  />
                )}
                <button
                  onClick={() => handleClick(n)}
                  className={`flex-1 text-right ${hasLink ? 'cursor-pointer' : 'cursor-default'}`}
                  type="button"
                >
                  <p className={`text-sm ${n.read ? 'text-gray-600' : 'text-gray-800'}`}>
                    {n.message}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                    <span>
                      {new Date(n.createdAt).toLocaleDateString('he-IL')}{' '}
                      {new Date(n.createdAt).toLocaleTimeString('he-IL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {hasLink && (
                      <span className="inline-flex items-center gap-0.5 text-blue-600">
                        <span aria-hidden="true">←</span>
                        <span>פתיחה</span>
                      </span>
                    )}
                  </div>
                </button>
                {!n.read && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    className="shrink-0 self-center rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-100"
                    title="סמן כנקרא"
                    type="button"
                  >
                    סמן כנקרא
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <InfiniteScrollTrigger
        onTrigger={() => fetchNextPage()}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}
