import type { DomainUser, RevisionStatus } from '@/domain/types';
import { canManageMinorChangeRequest } from '@/domain/minor-change/rules';
import { findRevisionById } from '@/db/revision-repository';
import {
  findPendingRequestByRevision,
  deleteMinorChangeRequest,
} from '@/db/minor-change-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface DeleteMinorChangeInput {
  user: DomainUser;
  revisionId: string;
}

export async function deleteMinorChange(input: DeleteMinorChangeInput): Promise<void> {
  const revision = await findRevisionById(input.revisionId);
  if (!revision) throw new Error('Revision not found');

  const domainRevision = {
    id: revision.id,
    articleId: revision.articleId,
    status: revision.status as RevisionStatus,
    createdByUserId: revision.createdByUserId,
  };

  if (!canManageMinorChangeRequest(input.user, domainRevision)) {
    throw new Error(
      'Only the revision creator, admins or senior users can delete a minor change request',
    );
  }

  const pendingMcr = await findPendingRequestByRevision(input.revisionId);
  if (!pendingMcr) throw new Error('No pending minor change request found');

  await deleteMinorChangeRequest(pendingMcr.id);

  await createAuditLog({
    action: 'MINOR_CHANGE_DELETED',
    entityType: 'MinorChangeRequest',
    entityId: pendingMcr.id,
    userId: input.user.id,
    metadata: { revisionId: input.revisionId },
  });
}
