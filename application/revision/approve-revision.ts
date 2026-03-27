import type { DomainUser, RevisionStatus } from '@/domain/types';
import { canApproveRevision } from '@/domain/revision/approval';
import { findRevisionById } from '@/db/revision-repository';
import { performApproval } from './_perform-approval';

export interface ApproveRevisionInput {
  user: DomainUser;
  revisionId: string;
}

export async function approveRevision(input: ApproveRevisionInput): Promise<void> {
  const revision = await findRevisionById(input.revisionId);
  if (!revision) throw new Error('Revision not found');

  const domainRevision = {
    id: revision.id,
    articleId: revision.articleId,
    status: revision.status as RevisionStatus,
    createdByUserId: revision.createdByUserId,
  };

  const guard = canApproveRevision(input.user, domainRevision);
  if (!guard.success) throw new Error(guard.error);

  await performApproval({
    revision,
    approvedByUserId: input.user.id,
    isMinorChange: false,
  });
}
