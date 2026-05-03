'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getNotificationLink } from '@/lib/notification-links';
import { emitUnreadCount } from '@/lib/notification-events';
import { InfiniteScrollTrigger } from './infinite-scroll-trigger';

interface Notification {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationInboxProps {
  initialNotifications: Notification[];
}

export function NotificationInbox({ initialNotifications }: NotificationInboxProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [markingAll, setMarkingAll] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialNotifications.length >= 20);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || notifications.length === 0) return;
    setLoadingMore(true);
    try {
      const lastId = notifications[notifications.length - 1].id;
      const res = await fetch(`/api/notifications?cursor=${lastId}&limit=20`);
      if (res.ok) {
        const json = await res.json();
        const newItems = json.data?.notifications ?? [];
        if (newItems.length < 20) setHasMore(false);
        setNotifications((prev) => [...prev, ...newItems]);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, notifications]);

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        emitUnreadCount(0);
      }
    } finally {
      setMarkingAll(false);
    }
  }

  function applyRead(id: string) {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read) return;
    const nextUnread = notifications.filter((n) => !n.read && n.id !== id).length;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    emitUnreadCount(nextUnread);
  }

  async function markRead(id: string) {
    applyRead(id);
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    });
  }

  async function handleClick(notification: Notification) {
    const link = getNotificationLink(notification.entityType, notification.entityId);
    if (!notification.read) {
      applyRead(notification.id);
      void fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notification.id }),
      });
    }
    if (link) router.push(link);
  }

  return (
    <div className="space-y-3" dir="rtl">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{unreadCount} התראות שלא נקראו</p>
          <button
            onClick={handleMarkAllRead}
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
                    onClick={() => markRead(n.id)}
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
        onTrigger={loadMore}
        hasMore={hasMore}
        isLoading={loadingMore}
      />
    </div>
  );
}
