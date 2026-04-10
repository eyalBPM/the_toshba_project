import { prisma } from './prisma';

export interface DbMinorChangeRequest {
  id: string;
  revisionId: string;
  requestingUserId: string;
  message: string | null;
  title: string | null;
  content: unknown;
  snapshotData: unknown;
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
  title: true,
  content: true,
  snapshotData: true,
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
  message?: string;
  title?: string;
  content?: unknown;
  snapshotData?: unknown;
}): Promise<DbMinorChangeRequest> {
  return prisma.minorChangeRequest.create({
    data: {
      revisionId: data.revisionId,
      requestingUserId: data.requestingUserId,
      message: data.message ?? null,
      title: data.title ?? null,
      content: data.content !== undefined ? (data.content as object) : undefined,
      snapshotData: data.snapshotData !== undefined ? (data.snapshotData as object) : undefined,
    },
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

export async function updateMinorChangeRequestContent(
  id: string,
  data: {
    title?: string;
    content?: unknown;
    snapshotData?: unknown;
    message?: string;
  },
): Promise<DbMinorChangeRequest> {
  return prisma.minorChangeRequest.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.content !== undefined ? { content: data.content as object } : {}),
      ...(data.snapshotData !== undefined ? { snapshotData: data.snapshotData as object } : {}),
      ...(data.message !== undefined ? { message: data.message } : {}),
    },
    select: REQUEST_SELECT,
  });
}

export async function deleteMinorChangeRequest(id: string): Promise<void> {
  await prisma.minorChangeRequest.delete({ where: { id } });
}
