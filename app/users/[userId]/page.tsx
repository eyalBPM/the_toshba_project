import { notFound } from 'next/navigation';
import { findUserById } from '@/db/user-repository';
import { findVerificationByUserId, findRequestsByRequester } from '@/db/verification-repository';
import { getCurrentUser } from '@/lib/auth-utils';
import { StatusBadge } from '@/ui/components/status-badge';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const [user, verification, currentUser] = await Promise.all([
    findUserById(userId),
    findVerificationByUserId(userId),
    getCurrentUser(),
  ]);

  if (!user) notFound();

  const isOwnProfile = currentUser?.id === userId;
  const ownRequests = isOwnProfile ? await findRequestsByRequester(userId) : [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">{user.name}</h1>
        <p className="mb-4 text-sm text-gray-500">{user.email}</p>

        <div className="mb-4 flex gap-2">
          <StatusBadge type="userStatus" value={user.status} />
          {user.role !== 'User' && <StatusBadge type="userRole" value={user.role} />}
        </div>

        {verification && (
          <p className="text-sm text-gray-600">
            אומת על ידי{' '}
            <a href={`/users/${verification.verifiedBy.id}`} className="font-medium underline">
              {verification.verifiedBy.name}
            </a>{' '}
            בתאריך{' '}
            {new Date(verification.createdAt).toLocaleDateString('he-IL')}
          </p>
        )}

        {!verification && user.status === 'PendingVerification' && isOwnProfile && (
          <a
            href="/verification/request"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            בקש אימות
          </a>
        )}
      </div>

      {isOwnProfile && ownRequests.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">בקשות אימות שלי</h2>
          <ul className="space-y-2">
            {ownRequests.map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3 text-sm"
              >
                <span>
                  אל <strong>{req.verifier.name}</strong>
                </span>
                <StatusBadge type="requestStatus" value={req.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
