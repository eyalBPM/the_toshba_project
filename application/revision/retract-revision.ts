import type { DomainUser, RevisionStatus } from '@/domain/types';
import { validateTransition } from '@/domain/revision/state-machine';
import { findRevisionById, updateRevisionStatus } from '@/db/revision-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface RetractRevisionInput {
  user: DomainUser;
  revisionId: string;
}

export async function retractRevision(input: RetractRevisionInput): Promise<void> {
  const revision = await findRevisionById(input.revisionId);
  if (!revision) {
    throw new Error('Revision not found');
  }
  if (revision.createdByUserId !== input.user.id) {
    throw new Error('Only the revision creator can retract it');
  }

  const transition = validateTransition(revision.status as RevisionStatus, 'Draft');
  if (!transition.success) {
    throw new Error(transition.error);
  }

  await updateRevisionStatus(input.revisionId, 'Draft');

  await createAuditLog({
    action: 'REVISION_RETRACTED',
    entityType: 'ArticleRevision',
    entityId: input.revisionId,
    userId: input.user.id,
  });
}
