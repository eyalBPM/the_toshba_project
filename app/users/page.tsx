import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-utils';
import { listUsers } from '@/db/user-repository';
import { StatusBadge } from '@/ui/components/status-badge';
import { UsersSearch } from './users-search';

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; role?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const viewer = await getCurrentUser();
  if (!viewer) redirect('/login?callbackUrl=/users');

  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const status =
    params.status === 'VerifiedUser' || params.status === 'PendingVerification'
      ? params.status
      : undefined;
  const role =
    params.role === 'Admin' ||
    params.role === 'Senior' ||
    params.role === 'Moderator' ||
    params.role === 'User'
      ? params.role
      : undefined;

  const users = await listUsers({ search, status, role, limit: 100 });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">משתמשים</h1>

      <UsersSearch initialSearch={search ?? ''} initialStatus={status ?? ''} initialRole={role ?? ''} />

      {users.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">לא נמצאו משתמשים.</p>
      ) : (
        <ul className="mt-6 divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link
                  href={`/users/${u.id}`}
                  className="text-sm font-medium text-blue-700 hover:underline"
                >
                  {u.name}
                </Link>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <div className="flex gap-2">
                <StatusBadge type="userStatus" value={u.status} />
                {u.role !== 'User' && <StatusBadge type="userRole" value={u.role} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
