import { prisma } from './prisma';

export interface DbPrintList {
  id: string;
  userId: string;
  settings: unknown;
  createdAt: Date;
  user: { id: string; name: string };
}

const PRINT_LIST_SELECT = {
  id: true,
  userId: true,
  settings: true,
  createdAt: true,
  user: { select: { id: true, name: true } },
} as const;

export async function createPrintList(data: {
  userId: string;
  settings: unknown;
}): Promise<DbPrintList> {
  return prisma.printList.create({
    data: {
      userId: data.userId,
      settings: (data.settings ?? {}) as object,
    },
    select: PRINT_LIST_SELECT,
  });
}

export async function findPrintListById(id: string): Promise<DbPrintList | null> {
  return prisma.printList.findUnique({ where: { id }, select: PRINT_LIST_SELECT });
}

export async function listPrintListsByUser(userId: string): Promise<DbPrintList[]> {
  return prisma.printList.findMany({
    where: { userId },
    select: PRINT_LIST_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function updatePrintListSettings(
  id: string,
  settings: unknown,
): Promise<DbPrintList> {
  return prisma.printList.update({
    where: { id },
    data: { settings: settings as object },
    select: PRINT_LIST_SELECT,
  });
}

export async function deletePrintList(id: string): Promise<void> {
  await prisma.printList.delete({ where: { id } });
}
