import type { DomainUser } from '@/domain/types';
import { canWriteResponse } from '@/domain/permissions/rules';
import { createPrintList as dbCreate, type DbPrintList } from '@/db/print-list-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface CreatePrintListInput {
  user: DomainUser;
  settings: unknown;
}

export async function createPrintList(input: CreatePrintListInput): Promise<DbPrintList> {
  if (!canWriteResponse(input.user.status)) {
    throw new Error('Only verified users can create print lists');
  }

  const list = await dbCreate({
    userId: input.user.id,
    settings: input.settings,
  });

  await createAuditLog({
    action: 'PRINT_LIST_CREATED',
    entityType: 'PrintList',
    entityId: list.id,
    userId: input.user.id,
  });

  return list;
}
