import type { DomainUser, RevisionStatus } from '@/domain/types';
import { validateTransition } from '@/domain/revision/state-machine';
import { findRevisionById, updateRevisionStatus } from '@/db/revision-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface SubmitRevisionInput {
  user: DomainUser;
  revisionId: string;
}

export async function submitRevision(input: SubmitRevisionInput): Promise<void> {
  const revision = await findRevisionById(input.revisionId);
  if (!revision) {
    throw new Error('Revision not found');
  }
  if (revision.createdByUserId !== input.user.id) {
    throw new Error('Only the revision creator can submit it');
  }
  if (!revision.title.trim()) {
    throw new Error('Revision title cannot be empty');
  }

  const transition = validateTransition(revision.status as RevisionStatus, 'Pending');
  if (!transition.success) {
    throw new Error(transition.error);
  }

  await updateRevisionStatus(input.revisionId, 'Pending');

  await createAuditLog({
    action: 'REVISION_SUBMITTED',
    entityType: 'ArticleRevision',
    entityId: input.revisionId,
    userId: input.user.id,
  });
}
