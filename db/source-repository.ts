import { prisma } from './prisma';

export interface DbSource {
  id: string;
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

export async function findSourceById(id: string): Promise<DbSource | null> {
  return prisma.source.findUnique({ where: { id }, select: SOURCE_SELECT });
}
