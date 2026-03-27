import { prisma } from './prisma';

export interface DbSage {
  id: string;
  text: string;
}

const SAGE_SELECT = { id: true, text: true } as const;

export async function findSageByText(text: string): Promise<DbSage | null> {
  return prisma.sage.findUnique({ where: { text }, select: SAGE_SELECT });
}

export async function findSageById(id: string): Promise<DbSage | null> {
  return prisma.sage.findUnique({ where: { id }, select: SAGE_SELECT });
}

export async function listSages(opts: { search?: string } = {}): Promise<DbSage[]> {
  return prisma.sage.findMany({
    where: opts.search
      ? { text: { contains: opts.search, mode: 'insensitive' } }
      : undefined,
    select: SAGE_SELECT,
    orderBy: { text: 'asc' },
    take: 50,
  });
}

export async function createSage(text: string): Promise<DbSage> {
  return prisma.sage.create({ data: { text }, select: SAGE_SELECT });
}
