import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { findPendingRequestByRequester } from '@/db/verification-repository';
import { VerificationRequestForm } from './verification-request-form';
import { PendingRequestPanel } from './pending-request-panel';

export default async function VerificationRequestPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?callbackUrl=/verification/request');

  if (user.status === 'VerifiedUser') {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center">
        <p className="text-gray-600">החשבון שלך כבר מאומת.</p>
        <a href={`/users/${user.id}`} className="mt-4 inline-block text-blue-600 underline">
          לפרופיל שלי
        </a>
      </main>
    );
  }

  const pending = await findPendingRequestByRequester(user.id);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">בקשת אימות</h1>
      {pending ? (
        <PendingRequestPanel
          requestId={pending.id}
          verifierName={pending.verifier.name}
          message={pending.message}
          createdAt={pending.createdAt.toISOString()}
        />
      ) : (
        <VerificationRequestForm userId={user.id} />
      )}
    </main>
  );
}
