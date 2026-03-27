import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-utils';
import { findPendingRequestsByVerifier } from '@/db/verification-repository';
import { StatusBadge } from '@/ui/components/status-badge';

export default async function VerificationRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?callbackUrl=/verification-requests');

  const requests = await findPendingRequestsByVerifier(user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">בקשות אימות ממתינות</h1>

      {requests.length === 0 ? (
        <p className="text-gray-500">אין בקשות ממתינות</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((req) => (
            <li key={req.id}>
              <Link
                href={`/verification-requests/${req.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{req.requester.name}</p>
                  <p className="text-sm text-gray-500">{req.requester.email}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-gray-600">{req.message}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge type="requestStatus" value={req.status} />
                  <span className="text-xs text-gray-400">
                    {new Date(req.createdAt).toLocaleDateString('he-IL')}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
