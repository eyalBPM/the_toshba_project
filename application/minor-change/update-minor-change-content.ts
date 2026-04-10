import type { DomainUser } from '@/domain/types';
import { findRevisionById } from '@/db/revision-repository';
import {
  findMinorChangeRequestById,
  updateMinorChangeRequestContent,
  type DbMinorChangeRequest,
} from '@/db/minor-change-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface UpdateMinorChangeContentInput {
  user: DomainUser;
  requestId: string;
  title?: string;
  content?: unknown;
  snapshotData?: unknown;
  message?: string;
}

export async function updateMinorChangeContent(
  input: UpdateMinorChangeContentInput,
): Promise<DbMinorChangeRequest> {
  const request = await findMinorChangeRequestById(input.requestId);
  if (!request) throw new Error('Minor change request not found');

  if (request.status !== 'Pending') {
    throw new Error('MCR_STATUS_CHANGED');
  }

  const revision = await findRevisionById(request.revisionId);
  if (!revision) throw new Error('Revision not found');

  if (revision.createdByUserId !== input.user.id) {
    throw new Error('Only the revision creator can update a minor change request');
  }

  const updated = await updateMinorChangeRequestContent(input.requestId, {
    title: input.title,
    content: input.content,
    snapshotData: input.snapshotData,
    message: input.message,
  });

  await createAuditLog({
    action: 'MINOR_CHANGE_UPDATED',
    entityType: 'MinorChangeRequest',
    entityId: input.requestId,
    userId: input.user.id,
    metadata: { revisionId: request.revisionId },
  });

  return updated;
}
