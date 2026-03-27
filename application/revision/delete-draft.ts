import type { DomainUser } from '@/domain/types';
import { findRevisionById, deleteRevision } from '@/db/revision-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface DeleteDraftInput {
  user: DomainUser;
  revisionId: string;
}

export async function deleteDraft(input: DeleteDraftInput): Promise<void> {
  const revision = await findRevisionById(input.revisionId);
  if (!revision) {
    throw new Error('Revision not found');
  }
  if (revision.createdByUserId !== input.user.id) {
    throw new Error('Only the revision creator can delete it');
  }
  if (revision.status !== 'Draft') {
    throw new Error('Only draft revisions can be deleted');
  }

  await createAuditLog({
    action: 'DRAFT_DELETED',
    entityType: 'ArticleRevision',
    entityId: input.revisionId,
    userId: input.user.id,
  });

  await deleteRevision(input.revisionId);
}
