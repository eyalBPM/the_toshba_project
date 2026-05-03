import type { DomainUser, MinorChangeRequestStatus } from '@/domain/types';
import { canApproveMinorChange } from '@/domain/permissions/rules';
import { validateMinorChangeTransition } from '@/domain/minor-change/rules';
import { prisma } from '@/db/prisma';
import {
  findMinorChangeRequestById,
  updateMinorChangeRequestStatus,
} from '@/db/minor-change-repository';
import { findRevisionById, updateRevisionContent } from '@/db/revision-repository';
import { updateArticleCurrentRevision } from '@/db/article-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

interface SnapshotFields {
  sourcesSnapshot?: unknown;
  topicsSnapshot?: unknown;
  sagesSnapshot?: unknown;
  referencesSnapshot?: unknown;
  contentLength?: number;
}

export interface ApproveMinorChangeInput {
  actingUser: DomainUser;
  requestId: string;
}

export async function approveMinorChange(input: ApproveMinorChangeInput): Promise<void> {
  if (!canApproveMinorChange(input.actingUser.role)) {
    throw new Error('Only admins can approve minor change requests');
  }

  const request = await findMinorChangeRequestById(input.requestId);
  if (!request) throw new Error('Minor change request not found');

  const transition = validateMinorChangeTransition(
    request.status as MinorChangeRequestStatus,
    'Approved',
  );
  if (!transition.success) throw new Error(transition.error);

  await prisma.$transaction(async () => {
    await updateMinorChangeRequestStatus(
      input.requestId,
      'Approved',
      input.actingUser.id,
    );

    // Copy MCR content into the revision if content fields are present
    if (request.title || request.content || request.snapshotData) {
      const revision = await findRevisionById(request.revisionId);
      if (revision) {
        const snapshotFields = (request.snapshotData ?? {}) as SnapshotFields;
        await updateRevisionContent(request.revisionId, {
          title: (request.title ?? revision.title),
          content: (request.content ?? revision.content),
          snapshot: {
            sourcesSnapshot: snapshotFields.sourcesSnapshot,
            topicsSnapshot: snapshotFields.topicsSnapshot,
            sagesSnapshot: snapshotFields.sagesSnapshot,
            referencesSnapshot: snapshotFields.referencesSnapshot,
            contentLength: snapshotFields.contentLength,
          },
        });

        // If revision belongs to an article and is the current revision, update article snapshot
        if (revision.articleId && revision.article) {
          const updatedRevision = await findRevisionById(request.revisionId);
          if (updatedRevision) {
            await updateArticleCurrentRevision(
              revision.articleId,
              updatedRevision.id,
              updatedRevision.snapshotId,
              updatedRevision.title,
            );
          }
        }
      }
    }

    await createAuditLog({
      action: 'MINOR_CHANGE_APPROVED',
      entityType: 'MinorChangeRequest',
      entityId: input.requestId,
      userId: input.actingUser.id,
      metadata: {
        revisionId: request.revisionId,
        hasContentChanges: !!(request.title || request.content || request.snapshotData),
      },
    });

    await createNotification({
      userId: request.requestingUserId,
      type: 'MINOR_CHANGE_APPROVED',
      entityType: 'MinorChangeRequest',
      entityId: input.requestId,
      message: 'בקשת השינוי המינורי אושרה והשינויים הוחלו על הגרסה',
    });
  });
}
