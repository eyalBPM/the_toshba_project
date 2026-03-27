import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { VerificationRequestForm } from './verification-request-form';

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

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">בקשת אימות</h1>
      <VerificationRequestForm userId={user.id} />
    </main>
  );
}
