import type { DomainUser } from '@/domain/types';
import { canRevokeVerification } from '@/domain/permissions/rules';
import { prisma } from '@/db/prisma';
import { findUserById, updateUserStatus } from '@/db/user-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface RevokeVerificationInput {
  actingUser: DomainUser;
  targetUserId: string;
}

export async function revokeVerification(input: RevokeVerificationInput): Promise<void> {
  if (!canRevokeVerification(input.actingUser.role)) {
    throw new Error('Only admins or seniors can revoke verification');
  }

  if (input.actingUser.id === input.targetUserId) {
    throw new Error('Cannot revoke your own verification');
  }

  const targetUser = await findUserById(input.targetUserId);
  if (!targetUser) throw new Error('User not found');

  if (targetUser.status !== 'VerifiedUser') {
    throw new Error('User is not verified');
  }

  if (targetUser.role !== 'User') {
    throw new Error('Cannot revoke verification of users with elevated roles');
  }

  await prisma.$transaction(async () => {
    await updateUserStatus(input.targetUserId, 'PendingVerification');

    await createAuditLog({
      action: 'VERIFICATION_REVOKED_BY_ADMIN',
      entityType: 'User',
      entityId: input.targetUserId,
      userId: input.actingUser.id,
      metadata: { actingRole: input.actingUser.role },
    });

    await createNotification({
      userId: input.targetUserId,
      type: 'VERIFICATION_REVOKED',
      entityType: 'User',
      entityId: input.targetUserId,
      message: 'אימות חשבונך בוטל על ידי הנהלת המערכת',
    });
  });
}
