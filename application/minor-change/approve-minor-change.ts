import type { DomainUser, MinorChangeRequestStatus } from '@/domain/types';
import { canApproveMinorChange } from '@/domain/permissions/rules';
import { validateMinorChangeTransition } from '@/domain/minor-change/rules';
import { prisma } from '@/db/prisma';
import {
  findMinorChangeRequestById,
  updateMinorChangeRequestStatus,
} from '@/db/minor-change-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface ApproveMinorChangeInput {
  actingUser: DomainUser;
  requestId: string;
}

export async function approveMinorChange(input: ApproveMinorChangeInput): Promise<void> {
  if (!canApproveMinorChange(input.actingUser.role)) {
    throw new Error('Only admins can approve minor change requests');
  }

  const request = await findMinorChangeRequestById(input.requestId);
  if (!request) throw new Error('Minor change request not found');

  const transition = validateMinorChangeTransition(
    request.status as MinorChangeRequestStatus,
    'Approved',
  );
  if (!transition.success) throw new Error(transition.error);

  await prisma.$transaction(async () => {
    await updateMinorChangeRequestStatus(
      input.requestId,
      'Approved',
      input.actingUser.id,
    );

    await createAuditLog({
      action: 'MINOR_CHANGE_APPROVED',
      entityType: 'MinorChangeRequest',
      entityId: input.requestId,
      userId: input.actingUser.id,
      metadata: { revisionId: request.revisionId },
    });

    await createNotification({
      userId: request.requestingUserId,
      type: 'MINOR_CHANGE_APPROVED',
      entityType: 'MinorChangeRequest',
      entityId: input.requestId,
      message: 'בקשת השינוי המינורי אושרה - ניתן לערוך ללא איפוס ההסכמות',
    });
  });
}
