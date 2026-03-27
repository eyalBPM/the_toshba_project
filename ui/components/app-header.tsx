'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { NotificationBell } from './notification-bell';

export function AppHeader() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const user = session.user as { name?: string; role?: string };

  return (
    <header className="border-b border-gray-200 bg-white" dir="rtl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link href="/articles" className="text-lg font-bold text-blue-700">
          תושב&quot;ע
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/drafts" className="text-sm text-gray-600 hover:text-gray-900">
            טיוטות
          </Link>
          {(user.role === 'Admin' || user.role === 'Senior') && (
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
              ניהול
            </Link>
          )}
          <NotificationBell />
          <span className="text-sm text-gray-500">{user.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            יציאה
          </button>
        </div>
      </div>
    </header>
  );
}
