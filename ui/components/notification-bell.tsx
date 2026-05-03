'use client';

import Link from 'next/link';
import { useUnreadNotificationsCount } from '@/ui/hooks/use-notifications';

export function NotificationBell() {
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
    >
      <span>התראות</span>
      {unreadCount > 0 && (
        <span className="mr-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
