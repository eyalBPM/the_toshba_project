import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { findVerificationRequestById } from '@/db/verification-repository';
import { StatusBadge } from '@/ui/components/status-badge';
import { VerificationActions } from './verification-actions';

export default async function VerificationRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, request] = await Promise.all([
    getCurrentUser(),
    findVerificationRequestById(id),
  ]);

  if (!user) redirect(`/login?callbackUrl=/verification-requests/${id}`);
  if (!request) notFound();

  const isVerifier = request.requestedVerifierId === user.id;
  const canAct = isVerifier && request.status === 'Pending';

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">בקשת אימות</h1>
        <StatusBadge type="requestStatus" value={request.status} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-500">מבקש</p>
          <a
            href={`/users/${request.requester.id}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {request.requester.name}
          </a>
          <p className="text-sm text-gray-500">{request.requester.email}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-500">הודעה</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{request.message}</p>
        </div>

        <p className="text-xs text-gray-400">
          נשלח ב-{new Date(request.createdAt).toLocaleDateString('he-IL')}
        </p>
      </div>

      {canAct && <VerificationActions requestId={id} />}
    </main>
  );
}
