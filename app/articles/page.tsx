import { getCurrentUser } from '@/lib/auth-utils';
import { NewRevisionButton } from './new-revision-button';
import { ArticlesTable } from '@/ui/components/articles-table';

export default async function ArticlesPage() {
  const currentUser = await getCurrentUser();
  const isVerified = currentUser?.status === 'VerifiedUser';

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ערכים</h1>
        {isVerified && <NewRevisionButton />}
      </div>

      <ArticlesTable />
    </main>
  );
}
