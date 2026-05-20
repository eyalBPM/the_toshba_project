import type { DomainUser } from '@/domain/types';
import { canMergeTopicsAndSages } from '@/domain/permissions/rules';
import {
  mergeTopicsTransaction,
  type MergeEntityResult,
} from '@/db/entity-merge';

export interface MergeTopicsInput {
  actingUser: DomainUser;
  victimId: string;
  winnerId: string;
}

export async function mergeTopics(input: MergeTopicsInput): Promise<MergeEntityResult> {
  if (!canMergeTopicsAndSages(input.actingUser.role)) {
    throw new Error('FORBIDDEN');
  }
  return mergeTopicsTransaction({
    victimId: input.victimId,
    winnerId: input.winnerId,
    actingUserId: input.actingUser.id,
  });
}
