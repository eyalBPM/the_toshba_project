'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getNotificationLink } from '@/lib/notification-links';
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
      }
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleClick(notification: Notification) {
    if (!notification.read) {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notification.id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
    }
    const link = getNotificationLink(notification.entityType, notification.entityId);
    router.push(link);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between rounded-md border p-3 ${
                n.read
                  ? 'border-gray-200 bg-white'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <button
                onClick={() => handleClick(n)}
                className="flex-1 text-right"
              >
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleDateString('he-IL')}{' '}
                  {new Date(n.createdAt).toLocaleTimeString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </button>
              <button
                onClick={() => handleDelete(n.id)}
                className="mr-2 shrink-0 text-xs text-gray-400 hover:text-red-500"
                title="מחק"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <InfiniteScrollTrigger
        onTrigger={loadMore}
        hasMore={hasMore}
        isLoading={loadingMore}
      />
    </div>
  );
}
