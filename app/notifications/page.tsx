import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { listNotificationsByUser } from '@/db/notification-repository';
import { NotificationInbox } from '@/ui/components/notification-inbox';

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?callbackUrl=/notifications');

  const notifications = await listNotificationsByUser(currentUser.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">התראות</h1>
      <NotificationInbox initialNotifications={notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))} />
    </main>
  );
}
