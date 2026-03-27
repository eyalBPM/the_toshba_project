import type { DomainUser, RevisionStatus } from '@/domain/types';
import { canRequestMinorChange } from '@/domain/minor-change/rules';
import { findRevisionById } from '@/db/revision-repository';
import {
  createMinorChangeRequest as dbCreate,
  findPendingRequestByRevision,
  type DbMinorChangeRequest,
} from '@/db/minor-change-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface RequestMinorChangeInput {
  user: DomainUser;
  revisionId: string;
  message: string;
}

export async function requestMinorChange(
  input: RequestMinorChangeInput,
): Promise<DbMinorChangeRequest> {
  const revision = await findRevisionById(input.revisionId);
  if (!revision) throw new Error('Revision not found');

  const domainRevision = {
    id: revision.id,
    articleId: revision.articleId,
    status: revision.status as RevisionStatus,
    createdByUserId: revision.createdByUserId,
  };

  const guard = canRequestMinorChange(input.user, domainRevision);
  if (!guard.success) throw new Error(guard.error);

  const existing = await findPendingRequestByRevision(input.revisionId);
  if (existing) {
    throw new Error('A pending minor change request already exists for this revision');
  }

  const request = await dbCreate({
    revisionId: input.revisionId,
    requestingUserId: input.user.id,
    message: input.message,
  });

  await createAuditLog({
    action: 'MINOR_CHANGE_REQUESTED',
    entityType: 'MinorChangeRequest',
    entityId: request.id,
    userId: input.user.id,
    metadata: { revisionId: input.revisionId },
  });

  return request;
}
