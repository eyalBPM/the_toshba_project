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
