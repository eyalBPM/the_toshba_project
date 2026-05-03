'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { NotificationBell } from './notification-bell';

async function fetchCurrentUser() {
  const res = await fetch('/api/me');
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as { id: string; role: string; status: string };
}

export function AppHeader() {
  const { data: session } = useSession();

  const sessionUser = session?.user as { name?: string } | undefined;

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: fetchCurrentUser,
    enabled: !!sessionUser,
  });

  return (
    <header className="border-b border-gray-200 bg-white" dir="rtl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link href="/articles" className="text-lg font-bold text-blue-700">
          תושב&quot;ע
        </Link>

        <div className="flex items-center gap-3">
          {sessionUser ? (
            <>
              <Link href="/drafts" className="text-sm text-gray-600 hover:text-gray-900">
                טיוטות
              </Link>
              <Link href="/users" className="text-sm text-gray-600 hover:text-gray-900">
                משתמשים
              </Link>
              {currentUser?.status === 'PendingVerification' && (
                <Link
                  href="/verification/request"
                  className="text-sm text-amber-700 hover:text-amber-900"
                >
                  בקשת אימות
                </Link>
              )}
              {(currentUser?.role === 'Admin' || currentUser?.role === 'Senior') && (
                <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                  ניהול
                </Link>
              )}
              <NotificationBell />
              <span className="text-sm text-gray-500">{sessionUser.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                יציאה
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800">
              התחברות
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
