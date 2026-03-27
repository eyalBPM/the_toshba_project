import type { DomainUser, RevisionStatus } from '@/domain/types';
import { canRejectRevision } from '@/domain/revision/approval';
import { prisma } from '@/db/prisma';
import { findRevisionById, updateRevisionStatus } from '@/db/revision-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface RejectRevisionInput {
  user: DomainUser;
  revisionId: string;
  note?: string;
}

export async function rejectRevision(input: RejectRevisionInput): Promise<void> {
  const revision = await findRevisionById(input.revisionId);
  if (!revision) throw new Error('Revision not found');

  const domainRevision = {
    id: revision.id,
    articleId: revision.articleId,
    status: revision.status as RevisionStatus,
    createdByUserId: revision.createdByUserId,
  };

  const guard = canRejectRevision(input.user, domainRevision, input.note);
  if (!guard.success) throw new Error(guard.error);

  await prisma.$transaction(async () => {
    await updateRevisionStatus(input.revisionId, 'Rejected');

    await createAuditLog({
      action: 'REVISION_REJECTED',
      entityType: 'ArticleRevision',
      entityId: input.revisionId,
      userId: input.user.id,
      metadata: { rejectedByRole: input.user.role, note: input.note ?? null },
    });

    const noteText = input.note ? ` הערה: ${input.note}` : '';
    await createNotification({
      userId: revision.createdByUserId,
      type: 'REVISION_REJECTED',
      entityType: 'ArticleRevision',
      entityId: input.revisionId,
      message: `הגרסה שלך נדחתה.${noteText}`,
    });
  });
}
