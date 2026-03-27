import type { DomainUser } from '@/domain/types';
import { canGrantSeniorRole } from '@/domain/permissions/rules';
import { findUserById, updateUserRole } from '@/db/user-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface GrantSeniorRoleInput {
  actingUser: DomainUser;
  targetUserId: string;
}

export async function grantSeniorRole(input: GrantSeniorRoleInput): Promise<void> {
  if (!canGrantSeniorRole(input.actingUser.role)) {
    throw new Error('Only Senior users can grant the Senior role');
  }

  const targetUser = await findUserById(input.targetUserId);
  if (!targetUser) throw new Error('User not found');

  if (targetUser.status !== 'VerifiedUser') {
    throw new Error('Can only grant Senior role to verified users');
  }

  if (targetUser.role === 'Senior' || targetUser.role === 'Admin') {
    throw new Error('User already has an elevated role');
  }

  await updateUserRole(input.targetUserId, 'Senior');

  await createAuditLog({
    action: 'SENIOR_ROLE_GRANTED',
    entityType: 'User',
    entityId: input.targetUserId,
    userId: input.actingUser.id,
  });

  await createNotification({
    userId: input.targetUserId,
    type: 'ROLE_CHANGED',
    entityType: 'User',
    entityId: input.targetUserId,
    message: 'קיבלת הרשאת בכיר',
  });
}
