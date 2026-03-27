import type { DomainUser } from '@/domain/types';
import { canRequestVerification } from '@/domain/verification/rules';
import { findUserById } from '@/db/user-repository';
import {
  createVerificationRequest,
  findPendingRequestBetween,
} from '@/db/verification-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface RequestVerificationInput {
  requestingUser: DomainUser;
  requestedVerifierId: string;
  message: string;
}

export interface RequestVerificationResult {
  requestId: string;
}

export async function requestVerification(
  input: RequestVerificationInput,
): Promise<RequestVerificationResult> {
  const guard = canRequestVerification(input.requestingUser);
  if (!guard.success) {
    throw new Error(guard.error);
  }

  const verifier = await findUserById(input.requestedVerifierId);
  if (!verifier) {
    throw new Error('Verifier not found');
  }
  if (verifier.status !== 'VerifiedUser') {
    throw new Error('Verifier must be a verified user');
  }
  if (verifier.id === input.requestingUser.id) {
    throw new Error('Cannot request verification from yourself');
  }

  const existing = await findPendingRequestBetween(
    input.requestingUser.id,
    input.requestedVerifierId,
  );
  if (existing) {
    throw new Error('A pending request to this verifier already exists');
  }

  const request = await createVerificationRequest({
    requestingUserId: input.requestingUser.id,
    requestedVerifierId: input.requestedVerifierId,
    message: input.message,
  });

  await createNotification({
    userId: input.requestedVerifierId,
    type: 'VERIFICATION_REQUEST',
    entityType: 'VerificationRequest',
    entityId: request.id,
    message: 'קיבלת בקשת אימות חדשה',
  });

  await createAuditLog({
    action: 'VERIFICATION_REQUEST_CREATED',
    entityType: 'VerificationRequest',
    entityId: request.id,
    userId: input.requestingUser.id,
  });

  return { requestId: request.id };
}
