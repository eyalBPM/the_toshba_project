import { prisma } from '@/db/prisma';
import { generateSlug, resolveSlugConflict } from '@/domain/article/slug';
import { getCompetingRevisionPolicy } from '@/domain/revision/approval';
import {
  updateRevisionStatus,
  linkRevisionToArticle,
  listPendingRevisionsByArticle,
  type DbRevision,
} from '@/db/revision-repository';
import { createArticle, updateArticleCurrentRevision } from '@/db/article-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface PerformApprovalInput {
  revision: DbRevision;
  approvedByUserId: string;
  isMinorChange: boolean;
}

/**
 * Internal helper that performs all approval side-effects.
 * Shared by auto-approval (from create-agreement) and admin approval.
 *
 * Runs inside a prisma.$transaction to ensure atomicity.
 */
export async function performApproval(input: PerformApprovalInput): Promise<void> {
  const { revision, approvedByUserId, isMinorChange } = input;

  await prisma.$transaction(async () => {
    // Race guard: check status hasn't changed
    const current = await prisma.articleRevision.findUnique({
      where: { id: revision.id },
      select: { status: true },
    });
    if (!current || current.status !== 'Pending') return;

    // 1. Mark revision as Approved
    await updateRevisionStatus(revision.id, 'Approved');

    let articleId = revision.articleId;

    // 2. Create or update article
    if (!articleId) {
      // New article: generate slug and create
      const baseSlug = generateSlug(revision.title);
      const existingRows = await prisma.article.findMany({
        where: { slug: { startsWith: baseSlug } },
        select: { slug: true },
      });
      const existingSlugs = new Set(existingRows.map((r) => r.slug));
      const slug = resolveSlugConflict(baseSlug, existingSlugs);

      const article = await createArticle({
        title: revision.title,
        slug,
        currentRevisionId: revision.id,
        snapshotId: revision.snapshotId,
        createdByUserId: revision.createdByUserId,
      });
      articleId = article.id;

      // Link the revision to the newly created article
      await linkRevisionToArticle(revision.id, articleId);
    } else {
      // Existing article: update current revision + snapshot
      await updateArticleCurrentRevision(articleId, revision.id, revision.snapshotId);
    }

    // 3. Handle competing revisions
    const policy = getCompetingRevisionPolicy(isMinorChange);
    if (policy === 'reject' && articleId) {
      const competing = await listPendingRevisionsByArticle(articleId);
      for (const comp of competing) {
        if (comp.id === revision.id) continue;
        await updateRevisionStatus(comp.id, 'Rejected');
        await createAuditLog({
          action: 'REVISION_AUTO_REJECTED',
          entityType: 'ArticleRevision',
          entityId: comp.id,
          userId: approvedByUserId,
          metadata: { reason: 'competing_revision_approved', approvedRevisionId: revision.id },
        });
        await createNotification({
          userId: comp.createdByUserId,
          type: 'REVISION_REJECTED',
          entityType: 'ArticleRevision',
          entityId: comp.id,
          message: 'הגרסה שלך נדחתה כיוון שגרסה מתחרה אושרה',
        });
      }
    }

    // 4. Audit log
    await createAuditLog({
      action: 'REVISION_APPROVED',
      entityType: 'ArticleRevision',
      entityId: revision.id,
      userId: approvedByUserId,
      metadata: { articleId, isMinorChange },
    });

    // 5. Notify revision author
    await createNotification({
      userId: revision.createdByUserId,
      type: 'REVISION_APPROVED',
      entityType: 'ArticleRevision',
      entityId: revision.id,
      message: 'הגרסה שלך אושרה',
    });
  });
}
