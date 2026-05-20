import { prisma } from './prisma';

export interface DbMissingSource {
  id: string;
  revisionId: string;
  citationNumber: number;
  text: string;
  createdByUserId: string;
  createdAt: Date;
}

const SELECT_FIELDS = {
  id: true,
  revisionId: true,
  citationNumber: true,
  text: true,
  createdByUserId: true,
  createdAt: true,
} as const;

export async function createMissingSource(data: {
  revisionId: string;
  citationNumber: number;
  text: string;
  createdByUserId: string;
}): Promise<DbMissingSource> {
  return prisma.missingSources.create({ data, select: SELECT_FIELDS });
}

export async function listMissingSourcesByRevision(revisionId: string): Promise<DbMissingSource[]> {
  return prisma.missingSources.findMany({
    where: { revisionId },
    select: SELECT_FIELDS,
    orderBy: { citationNumber: 'asc' },
  });
}

export interface DbMissingSourceWithContext {
  id: string;
  revisionId: string;
  citationNumber: number;
  text: string;
  createdAt: Date;
  createdBy: { id: string; name: string };
  revision: {
    id: string;
    title: string;
    status: string;
    article: { slug: string } | null;
  };
}

export async function listAllMissingSources(opts: { limit?: number } = {}): Promise<
  DbMissingSourceWithContext[]
> {
  const limit = opts.limit ?? 200;
  return prisma.missingSources.findMany({
    select: {
      id: true,
      revisionId: true,
      citationNumber: true,
      text: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true } },
      revision: {
        select: {
          id: true,
          title: true,
          status: true,
          article: { select: { slug: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
