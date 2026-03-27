import { getCurrentUser } from '@/lib/auth-utils';
import { listUsers } from '@/db/user-repository';
import { StatusBadge } from '@/ui/components/status-badge';
import { GrantSeniorButton } from '@/ui/components/admin/grant-senior-button';
import { ResetCacheButton } from '@/ui/components/admin/reset-cache-button';

export default async function AdminUsersPage() {
  const [currentUser, users] = await Promise.all([
    getCurrentUser(),
    listUsers({}),
  ]);

  const isSenior = currentUser?.role === 'Senior';
  const isAdmin = currentUser?.role === 'Admin';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">משתמשים</h1>
        {isAdmin && <ResetCacheButton />}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-gray-600">שם</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">אימייל</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">סטטוס</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">תפקיד</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => {
              const canGrant =
                (isSenior || isAdmin) &&
                user.status === 'VerifiedUser' &&
                user.role === 'User' &&
                user.id !== currentUser?.id;

              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge type="userStatus" value={user.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge type="userRole" value={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    {canGrant && (
                      <GrantSeniorButton userId={user.id} userName={user.name} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
