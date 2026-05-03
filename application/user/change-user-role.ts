import type { DomainUser, UserRole } from '@/domain/types';
import { canManageRoles } from '@/domain/permissions/rules';
import { findUserById, updateUserRole } from '@/db/user-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface ChangeUserRoleInput {
  actingUser: DomainUser;
  targetUserId: string;
  newRole: UserRole;
}

const ROLE_LABEL: Record<UserRole, string> = {
  User: 'משתמש רגיל',
  Moderator: 'מנהל תוכן',
  Senior: 'מנהל בכיר',
  Admin: 'מנהל מערכת',
};

export async function changeUserRole(input: ChangeUserRoleInput): Promise<void> {
  if (!canManageRoles(input.actingUser.role)) {
    throw new Error('Only admins can manage user roles');
  }

  if (input.actingUser.id === input.targetUserId) {
    throw new Error('Cannot change your own role');
  }

  const targetUser = await findUserById(input.targetUserId);
  if (!targetUser) throw new Error('User not found');

  if (targetUser.status !== 'VerifiedUser') {
    throw new Error('Cannot change role of unverified users');
  }

  if (targetUser.role === input.newRole) {
    throw new Error('User already has this role');
  }

  const previousRole = targetUser.role as UserRole;
  await updateUserRole(input.targetUserId, input.newRole);

  await createAuditLog({
    action: 'USER_ROLE_CHANGED',
    entityType: 'User',
    entityId: input.targetUserId,
    userId: input.actingUser.id,
    metadata: { previousRole, newRole: input.newRole },
  });

  await createNotification({
    userId: input.targetUserId,
    type: 'ROLE_CHANGED',
    entityType: 'User',
    entityId: input.targetUserId,
    message: `תפקידך עודכן ל${ROLE_LABEL[input.newRole]}`,
  });
}
