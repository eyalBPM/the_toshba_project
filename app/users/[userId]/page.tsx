import { notFound } from 'next/navigation';
import { findUserById } from '@/db/user-repository';
import {
  findVerificationByUserId,
  findRequestsByRequester,
  findPendingRequestByRequester,
} from '@/db/verification-repository';
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

  const activeVerification = user.status === 'VerifiedUser' ? verification : null;
  const isOwnProfile = currentUser?.id === userId;
  const allOwnRequests = isOwnProfile ? await findRequestsByRequester(userId) : [];
  const ownRequests =
    user.status === 'VerifiedUser'
      ? allOwnRequests
      : allOwnRequests.filter((r) => r.status !== 'Approved');
  const viewerPendingRequest =
    currentUser?.status === 'PendingVerification'
      ? await findPendingRequestByRequester(currentUser.id)
      : null;
  const isVerifierOfViewerPending =
    !!viewerPendingRequest && viewerPendingRequest.requestedVerifierId === userId;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">{user.name}</h1>
        <p className="mb-4 text-sm text-gray-500">{user.email}</p>

        <div className="mb-4 flex gap-2">
          <StatusBadge type="userStatus" value={user.status} />
          {user.role !== 'User' && <StatusBadge type="userRole" value={user.role} />}
        </div>

        {activeVerification && (
          <p className="text-sm text-gray-600">
            אומת על ידי{' '}
            <a href={`/users/${activeVerification.verifiedBy.id}`} className="font-medium underline">
              {activeVerification.verifiedBy.name}
            </a>{' '}
            בתאריך{' '}
            {new Date(activeVerification.createdAt).toLocaleDateString('he-IL')}
          </p>
        )}

        {user.status === 'PendingVerification' &&
          isOwnProfile &&
          !viewerPendingRequest && (
            <a
              href="/verification/request"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              בקש אימות
            </a>
          )}

        {!isOwnProfile && isVerifierOfViewerPending && (
          <a
            href="/verification/request"
            className="mt-4 inline-block rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            צפה בבקשת האימות
          </a>
        )}
      </div>

      {isOwnProfile && ownRequests.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">בקשות אימות שלי</h2>
          <ul className="space-y-2">
            {ownRequests.map((req) => {
              const closedByAdmin =
                !!activeVerification &&
                req.status === 'Approved' &&
                activeVerification.verifiedByUserId !== req.requestedVerifierId;

              return (
                <li
                  key={req.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3 text-sm"
                >
                  <span>
                    אל <strong>{req.verifier.name}</strong>
                  </span>
                  {closedByAdmin ? (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      אומת על ידי המערכת
                    </span>
                  ) : (
                    <StatusBadge type="requestStatus" value={req.status} />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
