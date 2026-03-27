import { prisma } from './prisma';

export interface DbAgreement {
  id: string;
  revisionId: string;
  userId: string;
  createdAt: Date;
  user: { id: string; name: string };
}

const SELECT_FIELDS = {
  id: true,
  revisionId: true,
  userId: true,
  createdAt: true,
  user: { select: { id: true, name: true } },
} as const;

export async function createAgreement(
  revisionId: string,
  userId: string,
): Promise<DbAgreement> {
  return prisma.agreement.create({
    data: { revisionId, userId },
    select: SELECT_FIELDS,
  });
}

export async function countAgreementsByRevision(revisionId: string): Promise<number> {
  return prisma.agreement.count({ where: { revisionId } });
}

export async function hasUserAgreed(revisionId: string, userId: string): Promise<boolean> {
  const agreement = await prisma.agreement.findUnique({
    where: { revisionId_userId: { revisionId, userId } },
    select: { id: true },
  });
  return agreement !== null;
}

export async function deleteAgreementsByRevision(revisionId: string): Promise<number> {
  const result = await prisma.agreement.deleteMany({ where: { revisionId } });
  return result.count;
}

export async function listAgreementsByRevision(revisionId: string): Promise<DbAgreement[]> {
  return prisma.agreement.findMany({
    where: { revisionId },
    select: SELECT_FIELDS,
    orderBy: { createdAt: 'asc' },
  });
}
