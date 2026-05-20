import type { DomainUser } from '@/domain/types';
import { canMergeTopicsAndSages } from '@/domain/permissions/rules';
import {
  mergeSagesTransaction,
  type MergeEntityResult,
} from '@/db/entity-merge';

export interface MergeSagesInput {
  actingUser: DomainUser;
  victimId: string;
  winnerId: string;
}

export async function mergeSages(input: MergeSagesInput): Promise<MergeEntityResult> {
  if (!canMergeTopicsAndSages(input.actingUser.role)) {
    throw new Error('FORBIDDEN');
  }
  return mergeSagesTransaction({
    victimId: input.victimId,
    winnerId: input.winnerId,
    actingUserId: input.actingUser.id,
  });
}
