import type { DomainUser, VerificationRequestStatus } from '@/domain/types';
import { canVerify, validateVerificationTransition } from '@/domain/verification/rules';
import { prisma } from '@/db/prisma';
import {
  findVerificationRequestById,
  updateVerificationRequestStatus,
  createUserVerification,
} from '@/db/verification-repository';
import { updateUserStatus } from '@/db/user-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface ApproveVerificationInput {
  requestId: string;
  actingUser: DomainUser;
}

export async function approveVerification(input: ApproveVerificationInput): Promise<void> {
  const guard = canVerify(input.actingUser);
  if (!guard.success) {
    throw new Error(guard.error);
  }

  const request = await findVerificationRequestById(input.requestId);
  if (!request) {
    throw new Error('Verification request not found');
  }
  if (request.requestedVerifierId !== input.actingUser.id) {
    throw new Error('Not authorized to act on this request');
  }

  const transition = validateVerificationTransition(
    request.status as VerificationRequestStatus,
    'Approved',
  );
  if (!transition.success) {
    throw new Error(transition.error);
  }

  await prisma.$transaction(async () => {
    await updateVerificationRequestStatus(input.requestId, 'Approved');
    await updateUserStatus(request.requestingUserId, 'VerifiedUser');
    await createUserVerification(request.requestingUserId, input.actingUser.id);
    await createAuditLog({
      action: 'VERIFICATION_APPROVED',
      entityType: 'VerificationRequest',
      entityId: input.requestId,
      userId: input.actingUser.id,
      metadata: { verifiedUserId: request.requestingUserId },
    });
    await createNotification({
      userId: request.requestingUserId,
      type: 'VERIFICATION_APPROVED',
      entityType: 'VerificationRequest',
      entityId: input.requestId,
      message: 'בקשת האימות שלך אושרה',
    });
  });
}
