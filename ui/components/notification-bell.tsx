'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchCount() {
      try {
        const res = await fetch('/api/notifications?unread=true');
        if (res.ok && mounted) {
          const json = await res.json();
          setUnreadCount(json.data?.unreadCount ?? 0);
        }
      } catch {
        // Silently fail on poll errors
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

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
