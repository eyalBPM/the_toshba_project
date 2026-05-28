import { prisma } from './prisma';
import { Prisma } from '@/db/generated/prisma/client';

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
  updatedAt: Date;
  minSourceIndex: number | null;
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
  updatedAt: true,
  minSourceIndex: true,
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
  minSourceIndex?: number | null;
}): Promise<DbArticle> {
  const { minSourceIndex, ...rest } = data;
  return prisma.article.create({
    data: {
      ...rest,
      ...(minSourceIndex !== undefined ? { minSourceIndex } : {}),
    },
    select: ARTICLE_SELECT,
  });
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

// ─── /articles table view (heavy filter/sort/search) ─────────────────────

export type ArticleSortColumn = 'title' | 'sources' | 'topics' | 'sages' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

export interface ListArticlesForTableOpts {
  offset?: number;
  limit?: number;
  search?: string;
  searchInContent?: boolean;
  sort?: ArticleSortColumn;
  dir?: SortDir;
  books?: string[];
  topicIds?: string[];
  sageIds?: string[];
}

function buildOrderBy(sort: ArticleSortColumn, dir: SortDir): Prisma.Sql {
  const dirSql = dir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  // NULLS go to the end regardless of direction so a missing value never
  // floats to the top of the list.
  switch (sort) {
    case 'title':
      return Prisma.sql`a."title" ${dirSql}, a."id" ASC`;
    case 'sources':
      return Prisma.sql`a."minSourceIndex" ${dirSql} NULLS LAST, a."id" ASC`;
    case 'topics':
      return Prisma.sql`jsonb_array_length(s."topicsSnapshot") ${dirSql} NULLS LAST, a."id" ASC`;
    case 'sages':
      return Prisma.sql`jsonb_array_length(s."sagesSnapshot") ${dirSql} NULLS LAST, a."id" ASC`;
    case 'updatedAt':
      return Prisma.sql`a."updatedAt" ${dirSql}, a."id" ASC`;
  }
}

/**
 * The articles table page does a two-step fetch: a heavy raw query for
 * filtering/sorting/paging produces an ordered list of ids; a second typed
 * query loads the full snapshot payload. Keeps the dynamic SQL focused on
 * id selection while the row shape stays identical to the rest of the
 * repository.
 */
export async function listArticlesForTable(
  opts: ListArticlesForTableOpts,
): Promise<{ items: DbArticle[]; total: number }> {
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  const sort = opts.sort ?? 'updatedAt';
  const dir = opts.dir ?? (sort === 'updatedAt' || sort === 'topics' || sort === 'sages' ? 'desc' : 'asc');

  const conds: Prisma.Sql[] = [];

  if (opts.search && opts.search.trim().length > 0) {
    const pat = `%${opts.search.trim()}%`;
    conds.push(
      opts.searchInContent
        ? Prisma.sql`(a."title" ILIKE ${pat} OR r."content"::text ILIKE ${pat})`
        : Prisma.sql`a."title" ILIKE ${pat}`,
    );
  }

  if (opts.books && opts.books.length > 0) {
    // sourcesSnapshot @> '[{"book":"X"}]'::jsonb — uses the GIN index.
    const fragments = opts.books.map(
      (book) => Prisma.sql`s."sourcesSnapshot" @> ${JSON.stringify([{ book }])}::jsonb`,
    );
    conds.push(Prisma.sql`(${Prisma.join(fragments, ' OR ')})`);
  }

  if (opts.topicIds && opts.topicIds.length > 0) {
    const fragments = opts.topicIds.map(
      (id) => Prisma.sql`s."topicsSnapshot" @> ${JSON.stringify([{ id }])}::jsonb`,
    );
    conds.push(Prisma.sql`(${Prisma.join(fragments, ' OR ')})`);
  }

  if (opts.sageIds && opts.sageIds.length > 0) {
    const fragments = opts.sageIds.map(
      (id) => Prisma.sql`s."sagesSnapshot" @> ${JSON.stringify([{ id }])}::jsonb`,
    );
    conds.push(Prisma.sql`(${Prisma.join(fragments, ' OR ')})`);
  }

  const whereClause = conds.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conds, ' AND ')}`
    : Prisma.empty;

  // Content search needs ArticleRevision joined; otherwise skip the join.
  const contentJoin = opts.searchInContent
    ? Prisma.sql`LEFT JOIN "ArticleRevision" r ON a."currentRevisionId" = r."id"`
    : Prisma.empty;

  const orderBy = buildOrderBy(sort, dir);

  // 1. Get ordered page of ids.
  const idRows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT a."id"
    FROM "Article" a
    LEFT JOIN "ArticleSnapshot" s ON a."snapshotId" = s."id"
    ${contentJoin}
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ${limit} OFFSET ${offset}
  `);

  // 2. Total (for the next-cursor heuristic; cheaper than COUNT(*) over the
  // whole table thanks to GIN indexes on the filtered columns).
  const totalRows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "Article" a
    LEFT JOIN "ArticleSnapshot" s ON a."snapshotId" = s."id"
    ${contentJoin}
    ${whereClause}
  `);
  const total = Number(totalRows[0]?.count ?? 0);

  if (idRows.length === 0) return { items: [], total };

  const ids = idRows.map((r) => r.id);
  const rows = await prisma.article.findMany({
    where: { id: { in: ids } },
    select: ARTICLE_SELECT,
  });
  const byId = new Map(rows.map((r) => [r.id, r] as const));
  const items: DbArticle[] = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (row) items.push(row);
  }
  return { items, total };
}

export async function updateArticleCurrentRevision(
  articleId: string,
  revisionId: string,
  snapshotId: string,
  title: string,
  minSourceIndex: number | null,
): Promise<DbArticle> {
  return prisma.article.update({
    where: { id: articleId },
    data: {
      currentRevisionId: revisionId,
      snapshotId,
      title,
      minSourceIndex,
      // Bumped on every snapshot swap so the /articles list can sort by
      // "last modified" without joining ArticleRevision.
      updatedAt: new Date(),
    },
    select: ARTICLE_SELECT,
  });
}
