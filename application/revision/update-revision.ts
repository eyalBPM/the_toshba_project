import type { DomainUser, RevisionStatus } from '@/domain/types';
import { canEditRevision, getEditPolicy, type EditPolicy } from '@/domain/revision/editing';
import { findRevisionById, updateRevisionContent, markRevisionMinorChangeEdit, type SnapshotInput } from '@/db/revision-repository';
import { countAgreementsByRevision, deleteAgreementsByRevision } from '@/db/agreement-repository';
import {
  findApprovedRequestByRevision,
  updateMinorChangeRequestStatus,
} from '@/db/minor-change-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface UpdateRevisionInput {
  user: DomainUser;
  revisionId: string;
  title: string;
  content: unknown;
  snapshot: SnapshotInput;
}

export interface UpdateRevisionResult {
  editPolicy: EditPolicy;
}

export async function updateRevision(input: UpdateRevisionInput): Promise<UpdateRevisionResult> {
  const revision = await findRevisionById(input.revisionId);
  if (!revision) {
    throw new Error('Revision not found');
  }

  const domainRevision = {
    id: revision.id,
    articleId: revision.articleId,
    status: revision.status as RevisionStatus,
    createdByUserId: revision.createdByUserId,
  };

  const editGuard = canEditRevision(domainRevision, input.user.id);
  if (!editGuard.success) {
    throw new Error(editGuard.error);
  }

  const approvedRequest = await findApprovedRequestByRevision(input.revisionId);
  const isMinorChangeApproved = !!approvedRequest;

  const agreementCount = await countAgreementsByRevision(input.revisionId);
  const editPolicy = getEditPolicy(agreementCount, isMinorChangeApproved);

  await updateRevisionContent(input.revisionId, {
    title: input.title,
    content: input.content,
    snapshot: input.snapshot,
  });

  if (editPolicy.willResetAgreements) {
    await deleteAgreementsByRevision(input.revisionId);
  }

  if (isMinorChangeApproved && approvedRequest) {
    await updateMinorChangeRequestStatus(approvedRequest.id, 'Used');
    await markRevisionMinorChangeEdit(input.revisionId);
  }

  await createAuditLog({
    action: 'REVISION_EDITED',
    entityType: 'ArticleRevision',
    entityId: input.revisionId,
    userId: input.user.id,
    metadata: { willResetAgreements: editPolicy.willResetAgreements, isMinorChangeApproved },
  });

  return { editPolicy };
}
