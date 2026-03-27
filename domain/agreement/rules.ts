import type { DomainRevision, DomainUser, Result } from '../types';
import { ok, fail } from '../types';
import { SYSTEM_CONFIG } from '@/lib/config';

export function canAgree(user: DomainUser, revision: DomainRevision): Result {
  if (user.status !== 'VerifiedUser') {
    return fail('Only verified users can agree on revisions');
  }
  if (revision.status !== 'Pending') {
    return fail('Can only agree on revisions with Pending status');
  }
  if (user.id === revision.createdByUserId) {
    return fail('Cannot agree with your own revision');
  }
  return ok();
}

export function hasReachedThreshold(agreementCount: number): boolean {
  return agreementCount >= SYSTEM_CONFIG.AGREEMENT_THRESHOLD;
}
