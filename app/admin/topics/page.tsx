import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { canMergeTopicsAndSages } from '@/domain/permissions/rules';
import { EntityMergePanel } from '@/ui/components/admin/entity-merge-panel';

export default async function AdminTopicsPage() {
  const user = await getCurrentUser();
  if (!user || !canMergeTopicsAndSages(user.role)) {
    redirect('/admin');
  }

  return (
    <EntityMergePanel
      kind="topic"
      listEndpoint="/api/topics"
      mergeEndpoint="/api/admin/topics/merge"
      labels={{ heading: 'ניהול נושאים', singular: 'נושא', plural: 'נושאים' }}
    />
  );
}
