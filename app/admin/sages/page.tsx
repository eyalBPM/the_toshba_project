import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { canMergeTopicsAndSages } from '@/domain/permissions/rules';
import { EntityMergePanel } from '@/ui/components/admin/entity-merge-panel';

export default async function AdminSagesPage() {
  const user = await getCurrentUser();
  if (!user || !canMergeTopicsAndSages(user.role)) {
    redirect('/admin');
  }

  return (
    <EntityMergePanel
      kind="sage"
      listEndpoint="/api/sages"
      mergeEndpoint="/api/admin/sages/merge"
      labels={{ heading: 'ניהול חכמים', singular: 'חכם', plural: 'חכמים' }}
    />
  );
}
