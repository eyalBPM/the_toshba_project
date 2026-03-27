import { prisma } from './prisma';

export interface DbVerificationRequest {
  id: string;
  requestingUserId: string;
  requestedVerifierId: string;
  message: string;
  status: string;
  createdAt: Date;
  requester: { id: string; name: string; email: string };
  verifier: { id: string; name: string };
}

export interface DbUserVerification {
  id: string;
  verifiedUserId: string;
  verifiedByUserId: string;
  createdAt: Date;
  verifiedBy: { id: string; name: string };
}

const REQUEST_SELECT = {
  id: true,
  requestingUserId: true,
  requestedVerifierId: true,
  message: true,
  status: true,
  createdAt: true,
  requester: { select: { id: true, name: true, email: true } },
  verifier: { select: { id: true, name: true } },
} as const;

const VERIFICATION_SELECT = {
  id: true,
  verifiedUserId: true,
  verifiedByUserId: true,
  createdAt: true,
  verifiedBy: { select: { id: true, name: true } },
} as const;

export async function createVerificationRequest(data: {
  requestingUserId: string;
  requestedVerifierId: string;
  message: string;
}): Promise<DbVerificationRequest> {
  return prisma.verificationRequest.create({
    data,
    select: REQUEST_SELECT,
  });
}

export async function findVerificationRequestById(
  id: string,
): Promise<DbVerificationRequest | null> {
  return prisma.verificationRequest.findUnique({
    where: { id },
    select: REQUEST_SELECT,
  });
}

export async function findPendingRequestsByVerifier(
  verifierId: string,
): Promise<DbVerificationRequest[]> {
  return prisma.verificationRequest.findMany({
    where: { requestedVerifierId: verifierId, status: 'Pending' },
    select: REQUEST_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function findRequestsByRequester(
  requestingUserId: string,
): Promise<DbVerificationRequest[]> {
  return prisma.verificationRequest.findMany({
    where: { requestingUserId },
    select: REQUEST_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function findPendingRequestBetween(
  requestingUserId: string,
  requestedVerifierId: string,
): Promise<DbVerificationRequest | null> {
  return prisma.verificationRequest.findFirst({
    where: { requestingUserId, requestedVerifierId, status: 'Pending' },
    select: REQUEST_SELECT,
  });
}

export async function updateVerificationRequestStatus(
  id: string,
  status: string,
): Promise<DbVerificationRequest> {
  return prisma.verificationRequest.update({
    where: { id },
    data: { status },
    select: REQUEST_SELECT,
  });
}

export async function createUserVerification(
  verifiedUserId: string,
  verifiedByUserId: string,
): Promise<DbUserVerification> {
  return prisma.userVerification.create({
    data: { verifiedUserId, verifiedByUserId },
    select: VERIFICATION_SELECT,
  });
}

export async function findVerificationByUserId(
  verifiedUserId: string,
): Promise<DbUserVerification | null> {
  return prisma.userVerification.findFirst({
    where: { verifiedUserId },
    select: VERIFICATION_SELECT,
  });
}
