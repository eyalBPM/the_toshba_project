import type { DomainUser } from '@/domain/types';
import {
  findVerificationRequestById,
  deleteVerificationRequest,
} from '@/db/verification-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface CancelVerificationInput {
  requestId: string;
  actingUser: DomainUser;
}

export async function cancelVerification(input: CancelVerificationInput): Promise<void> {
  const request = await findVerificationRequestById(input.requestId);
  if (!request) {
    throw new Error('Verification request not found');
  }
  if (request.requestingUserId !== input.actingUser.id) {
    throw new Error('Not authorized to cancel this request');
  }
  if (request.status !== 'Pending') {
    throw new Error('Only pending requests can be cancelled');
  }

  await deleteVerificationRequest(input.requestId);

  await createAuditLog({
    action: 'VERIFICATION_REQUEST_CANCELLED',
    entityType: 'VerificationRequest',
    entityId: input.requestId,
    userId: input.actingUser.id,
    metadata: { requestedVerifierId: request.requestedVerifierId },
  });
}
