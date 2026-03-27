import type { DomainUser, VerificationRequestStatus } from '@/domain/types';
import { canVerify, validateVerificationTransition } from '@/domain/verification/rules';
import {
  findVerificationRequestById,
  updateVerificationRequestStatus,
} from '@/db/verification-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface RejectVerificationInput {
  requestId: string;
  actingUser: DomainUser;
}

export async function rejectVerification(input: RejectVerificationInput): Promise<void> {
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
    'Rejected',
  );
  if (!transition.success) {
    throw new Error(transition.error);
  }

  await updateVerificationRequestStatus(input.requestId, 'Rejected');

  await createAuditLog({
    action: 'VERIFICATION_REJECTED',
    entityType: 'VerificationRequest',
    entityId: input.requestId,
    userId: input.actingUser.id,
    metadata: { requestingUserId: request.requestingUserId },
  });

  await createNotification({
    userId: request.requestingUserId,
    type: 'VERIFICATION_REJECTED',
    entityType: 'VerificationRequest',
    entityId: input.requestId,
    message: 'בקשת האימות שלך נדחתה',
  });
}
