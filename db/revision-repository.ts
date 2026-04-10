import { prisma } from './prisma';
import type { DbArticleSnapshot } from './article-repository';

export interface DbRevision {
  id: string;
  articleId: string | null;
  title: string;
  content: unknown;
  status: string;
  createdByUserId: string;
  snapshotId: string;
  createdAt: Date;
  updatedAt: Date;
  snapshot: DbArticleSnapshot;
  createdBy: { id: string; name: string };
  article: { id: string; title: string; slug: string } | null;
}

const SNAPSHOT_SELECT = {
  id: true,
  sourcesSnapshot: true,
  topicsSnapshot: true,
  sagesSnapshot: true,
  referencesSnapshot: true,
  contentLength: true,
} as const;

const REVISION_SELECT = {
  id: true,
  articleId: true,
  title: true,
  content: true,
  status: true,
  createdByUserId: true,
  snapshotId: true,
  createdAt: true,
  updatedAt: true,
  snapshot: { select: SNAPSHOT_SELECT },
  createdBy: { select: { id: true, name: true } },
  article: { select: { id: true, title: true, slug: true } },
} as const;

export interface SnapshotInput {
  sourcesSnapshot?: unknown;
  topicsSnapshot?: unknown;
  sagesSnapshot?: unknown;
  referencesSnapshot?: unknown;
  contentLength?: number;
}

export async function createRevisionWithSnapshot(data: {
  title: string;
  content?: unknown;
  createdByUserId: string;
  articleId?: string;
}): Promise<DbRevision> {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.articleSnapshot.create({ data: {} });
    const revision = await tx.articleRevision.create({
      data: {
        title: data.title,
        content: (data.content ?? {}) as object,
        createdByUserId: data.createdByUserId,
        articleId: data.articleId ?? null,
        snapshotId: snapshot.id,
      },
      select: REVISION_SELECT,
    });
    return revision;
  });
}

export async function findRevisionById(id: string): Promise<DbRevision | null> {
  return prisma.articleRevision.findUnique({ where: { id }, select: REVISION_SELECT });
}

export async function listRevisionsByArticle(articleId: string): Promise<DbRevision[]> {
  return prisma.articleRevision.findMany({
    where: { articleId },
    select: REVISION_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function listPendingRevisionsByArticle(articleId: string): Promise<DbRevision[]> {
  return prisma.articleRevision.findMany({
    where: { articleId, status: 'Pending' },
    select: REVISION_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function listRevisionsByUser(
  userId: string,
  opts: { includePending?: boolean; includeObsolete?: boolean } = {},
): Promise<DbRevision[]> {
  const statuses: string[] = ['Draft'];
  if (opts.includePending) statuses.push('Pending');
  if (opts.includeObsolete) statuses.push('Obsolete');

  const statusFilter = statuses.length === 1
    ? { status: statuses[0] }
    : { status: { in: statuses } };

  return prisma.articleRevision.findMany({
    where: { createdByUserId: userId, ...statusFilter },
    select: REVISION_SELECT,
    orderBy: { updatedAt: 'desc' },
  });
}

export async function listPendingRevisions(opts: {
  cursor?: string;
  limit?: number;
} = {}): Promise<DbRevision[]> {
  const limit = opts.limit ?? 50;
  return prisma.articleRevision.findMany({
    where: { status: 'Pending' },
    select: REVISION_SELECT,
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
}

export async function updateRevisionContent(
  id: string,
  data: {
    title: string;
    content: unknown;
    snapshot: SnapshotInput;
  },
): Promise<DbRevision> {
  return prisma.$transaction(async (tx) => {
    const revision = await tx.articleRevision.findUnique({
      where: { id },
      select: { snapshotId: true },
    });
    if (!revision) throw new Error('Revision not found');

    await tx.articleSnapshot.update({
      where: { id: revision.snapshotId },
      data: {
        ...(data.snapshot.sourcesSnapshot !== undefined
          ? { sourcesSnapshot: data.snapshot.sourcesSnapshot as object }
          : {}),
        ...(data.snapshot.topicsSnapshot !== undefined
          ? { topicsSnapshot: data.snapshot.topicsSnapshot as object }
          : {}),
        ...(data.snapshot.sagesSnapshot !== undefined
          ? { sagesSnapshot: data.snapshot.sagesSnapshot as object }
          : {}),
        ...(data.snapshot.referencesSnapshot !== undefined
          ? { referencesSnapshot: data.snapshot.referencesSnapshot as object }
          : {}),
        ...(data.snapshot.contentLength !== undefined
          ? { contentLength: data.snapshot.contentLength }
          : {}),
      },
    });

    return tx.articleRevision.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content as object,
      },
      select: REVISION_SELECT,
    });
  });
}

export async function updateRevisionStatus(id: string, status: string): Promise<DbRevision> {
  return prisma.articleRevision.update({
    where: { id },
    data: { status },
    select: REVISION_SELECT,
  });
}

export async function linkRevisionToArticle(
  id: string,
  articleId: string,
): Promise<DbRevision> {
  return prisma.articleRevision.update({
    where: { id },
    data: { articleId },
    select: REVISION_SELECT,
  });
}

export async function deleteRevision(id: string): Promise<void> {
  // Cascade deletes the snapshot due to onDelete: Cascade on snapshotId relation
  await prisma.articleRevision.delete({ where: { id } });
}

export async function listDraftRevisionsByArticle(articleId: string): Promise<DbRevision[]> {
  return prisma.articleRevision.findMany({
    where: { articleId, status: 'Draft' },
    select: REVISION_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export interface RevisionStatusInfo {
  id: string;
  status: string;
  articleId: string | null;
  createdByUserId: string;
  article: { slug: string } | null;
}

export async function findRevisionStatusById(id: string): Promise<RevisionStatusInfo | null> {
  return prisma.articleRevision.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      articleId: true,
      createdByUserId: true,
      article: { select: { slug: true } },
    },
  });
}
