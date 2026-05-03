import type { DomainUser } from '@/domain/types';
import { canDirectlyVerifyUsers } from '@/domain/permissions/rules';
import { prisma } from '@/db/prisma';
import { findUserById, updateUserStatus } from '@/db/user-repository';
import {
  createUserVerification,
  findPendingRequestByRequester,
  updateVerificationRequestStatus,
} from '@/db/verification-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface AdminVerifyUserInput {
  actingUser: DomainUser;
  targetUserId: string;
}

export async function adminVerifyUser(input: AdminVerifyUserInput): Promise<void> {
  if (!canDirectlyVerifyUsers(input.actingUser.role)) {
    throw new Error('Only admins or seniors can directly verify users');
  }

  if (input.actingUser.id === input.targetUserId) {
    throw new Error('Cannot verify yourself');
  }

  const targetUser = await findUserById(input.targetUserId);
  if (!targetUser) throw new Error('User not found');

  if (targetUser.status === 'VerifiedUser') {
    throw new Error('User is already verified');
  }

  const pendingRequest = await findPendingRequestByRequester(input.targetUserId);

  await prisma.$transaction(async () => {
    await updateUserStatus(input.targetUserId, 'VerifiedUser');
    await createUserVerification(input.targetUserId, input.actingUser.id);

    if (pendingRequest) {
      await updateVerificationRequestStatus(pendingRequest.id, 'Approved');
    }

    await createAuditLog({
      action: 'VERIFICATION_GRANTED_BY_ADMIN',
      entityType: 'User',
      entityId: input.targetUserId,
      userId: input.actingUser.id,
      metadata: {
        actingRole: input.actingUser.role,
        closedRequestId: pendingRequest?.id ?? null,
      },
    });

    await createNotification({
      userId: input.targetUserId,
      type: 'VERIFICATION_APPROVED',
      entityType: 'User',
      entityId: input.targetUserId,
      message: 'חשבונך אומת על ידי הנהלת המערכת',
    });
  });
}
