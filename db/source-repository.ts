import { prisma } from './prisma';

export interface DbSource {
  id: string;
  book: string;
  label: string;
  path: string;
  index: number;
}

export interface CreateSourceInput {
  id?: string;
  book: string;
  label: string;
  path: string;
  index: number;
}

const SOURCE_SELECT = {
  id: true,
  book: true,
  label: true,
  path: true,
  index: true,
} as const;

export async function listSources(): Promise<DbSource[]> {
  return prisma.source.findMany({
    select: SOURCE_SELECT,
    orderBy: { index: 'asc' },
  });
}

export async function listDistinctBooks(): Promise<string[]> {
  const rows = await prisma.source.findMany({
    select: { book: true },
    distinct: ['book'],
    orderBy: { book: 'asc' },
  });
  return rows.map((r) => r.book);
}

export async function findSourceById(id: string): Promise<DbSource | null> {
  return prisma.source.findUnique({ where: { id }, select: SOURCE_SELECT });
}

export async function findSourcesByIds(ids: string[]): Promise<DbSource[]> {
  if (ids.length === 0) return [];
  return prisma.source.findMany({
    where: { id: { in: ids } },
    select: SOURCE_SELECT,
  });
}

export async function createManySources(
  data: CreateSourceInput[],
): Promise<{ count: number }> {
  return prisma.source.createMany({ data, skipDuplicates: true });
}
