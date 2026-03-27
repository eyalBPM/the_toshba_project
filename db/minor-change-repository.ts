import { prisma } from './prisma';

export interface DbMinorChangeRequest {
  id: string;
  revisionId: string;
  requestingUserId: string;
  message: string;
  status: string;
  reviewedByUserId: string | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  requestedBy: { id: string; name: string };
  reviewedBy: { id: string; name: string } | null;
}

const REQUEST_SELECT = {
  id: true,
  revisionId: true,
  requestingUserId: true,
  message: true,
  status: true,
  reviewedByUserId: true,
  reviewNote: true,
  createdAt: true,
  updatedAt: true,
  requestedBy: { select: { id: true, name: true } },
  reviewedBy: { select: { id: true, name: true } },
} as const;

export async function createMinorChangeRequest(data: {
  revisionId: string;
  requestingUserId: string;
  message: string;
}): Promise<DbMinorChangeRequest> {
  return prisma.minorChangeRequest.create({
    data,
    select: REQUEST_SELECT,
  });
}

export async function findMinorChangeRequestById(
  id: string,
): Promise<DbMinorChangeRequest | null> {
  return prisma.minorChangeRequest.findUnique({
    where: { id },
    select: REQUEST_SELECT,
  });
}

export async function findApprovedRequestByRevision(
  revisionId: string,
): Promise<DbMinorChangeRequest | null> {
  return prisma.minorChangeRequest.findFirst({
    where: { revisionId, status: 'Approved' },
    select: REQUEST_SELECT,
  });
}

export async function findPendingRequestByRevision(
  revisionId: string,
): Promise<DbMinorChangeRequest | null> {
  return prisma.minorChangeRequest.findFirst({
    where: { revisionId, status: 'Pending' },
    select: REQUEST_SELECT,
  });
}

export async function listPendingMinorChangeRequests(): Promise<DbMinorChangeRequest[]> {
  return prisma.minorChangeRequest.findMany({
    where: { status: 'Pending' },
    select: REQUEST_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function listMinorChangeRequestsByRevision(
  revisionId: string,
): Promise<DbMinorChangeRequest[]> {
  return prisma.minorChangeRequest.findMany({
    where: { revisionId },
    select: REQUEST_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateMinorChangeRequestStatus(
  id: string,
  status: string,
  reviewedByUserId?: string,
  reviewNote?: string,
): Promise<DbMinorChangeRequest> {
  return prisma.minorChangeRequest.update({
    where: { id },
    data: {
      status,
      ...(reviewedByUserId !== undefined ? { reviewedByUserId } : {}),
      ...(reviewNote !== undefined ? { reviewNote } : {}),
    },
    select: REQUEST_SELECT,
  });
}
