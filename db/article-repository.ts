import { prisma } from './prisma';

export interface DbArticleSnapshot {
  id: string;
  sourcesSnapshot: unknown;
  topicsSnapshot: unknown;
  sagesSnapshot: unknown;
  referencesSnapshot: unknown;
  contentLength: number;
}

export interface DbArticle {
  id: string;
  title: string;
  slug: string;
  currentRevisionId: string | null;
  snapshotId: string | null;
  createdByUserId: string;
  createdAt: Date;
  snapshot: DbArticleSnapshot | null;
}

const ARTICLE_SELECT = {
  id: true,
  title: true,
  slug: true,
  currentRevisionId: true,
  snapshotId: true,
  createdByUserId: true,
  createdAt: true,
  snapshot: {
    select: {
      id: true,
      sourcesSnapshot: true,
      topicsSnapshot: true,
      sagesSnapshot: true,
      referencesSnapshot: true,
      contentLength: true,
    },
  },
} as const;

export async function createArticle(data: {
  title: string;
  slug: string;
  currentRevisionId: string;
  snapshotId: string;
  createdByUserId: string;
}): Promise<DbArticle> {
  return prisma.article.create({ data, select: ARTICLE_SELECT });
}

export async function findArticleBySlug(slug: string): Promise<DbArticle | null> {
  return prisma.article.findUnique({ where: { slug }, select: ARTICLE_SELECT });
}

export async function findArticleById(id: string): Promise<DbArticle | null> {
  return prisma.article.findUnique({ where: { id }, select: ARTICLE_SELECT });
}

export async function listArticles(opts: {
  cursor?: string;
  limit?: number;
  search?: string;
}): Promise<DbArticle[]> {
  const limit = opts.limit ?? 50;
  return prisma.article.findMany({
    select: ARTICLE_SELECT,
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    ...(opts.search ? { where: { title: { contains: opts.search, mode: 'insensitive' } } } : {}),
  });
}

export async function slugExists(slug: string): Promise<boolean> {
  const count = await prisma.article.count({ where: { slug } });
  return count > 0;
}

export async function updateArticleCurrentRevision(
  articleId: string,
  revisionId: string,
  snapshotId: string,
  title: string,
): Promise<DbArticle> {
  return prisma.article.update({
    where: { id: articleId },
    data: { currentRevisionId: revisionId, snapshotId, title },
    select: ARTICLE_SELECT,
  });
}
