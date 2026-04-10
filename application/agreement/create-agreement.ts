import type { DomainUser, RevisionStatus } from '@/domain/types';
import { canAgree } from '@/domain/agreement/rules';
import { shouldAutoApprove } from '@/domain/revision/approval';
import { findRevisionById } from '@/db/revision-repository';
import {
  createAgreement as dbCreateAgreement,
  countAgreementsByRevision,
  hasUserAgreed,
} from '@/db/agreement-repository';
import { findApprovedRequestByRevision } from '@/db/minor-change-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';
import { performApproval } from '@/application/revision/_perform-approval';

export interface CreateAgreementInput {
  user: DomainUser;
  userName: string;
  revisionId: string;
}

export interface CreateAgreementResult {
  agreementCount: number;
  approved: boolean;
}

export async function createAgreement(
  input: CreateAgreementInput,
): Promise<CreateAgreementResult> {
  const revision = await findRevisionById(input.revisionId);
  if (!revision) throw new Error('Revision not found');

  const domainRevision = {
    id: revision.id,
    articleId: revision.articleId,
    status: revision.status as RevisionStatus,
    createdByUserId: revision.createdByUserId,
  };

  const guard = canAgree(input.user, domainRevision);
  if (!guard.success) throw new Error(guard.error);

  const alreadyAgreed = await hasUserAgreed(input.revisionId, input.user.id);
  if (alreadyAgreed) throw new Error('CONFLICT');

  await dbCreateAgreement(input.revisionId, input.user.id);
  const newCount = await countAgreementsByRevision(input.revisionId);

  await createAuditLog({
    action: 'AGREEMENT_CREATED',
    entityType: 'ArticleRevision',
    entityId: input.revisionId,
    userId: input.user.id,
  });

  await createNotification({
    userId: revision.createdByUserId,
    type: 'AGREEMENT_RECEIVED',
    entityType: 'ArticleRevision',
    entityId: input.revisionId,
    message: `${input.userName || 'משתמש'} הסכים לגרסה שלך (${newCount} הסכמות)`,
  });

  let approved = false;
  if (shouldAutoApprove(newCount)) {
    const approvedMcr = await findApprovedRequestByRevision(input.revisionId);
    await performApproval({
      revision,
      approvedByUserId: 'system',
      isMinorChange: !!approvedMcr,
    });
    approved = true;
  }

  return { agreementCount: newCount, approved };
}
