import type { DomainUser, DomainRevision, Result } from '../types';
import { ok, fail } from '../types';
import { SYSTEM_CONFIG } from '@/lib/config';

export function canApproveRevision(user: DomainUser, revision: DomainRevision): Result {
  if (revision.status !== 'Pending') {
    return fail('Only pending revisions can be approved');
  }
  if (user.role !== 'Admin') {
    return fail('Only admins can manually approve revisions');
  }
  return ok();
}

export function canRejectRevision(
  user: DomainUser,
  revision: DomainRevision,
  rejectionNote?: string,
): Result {
  if (revision.status !== 'Pending') {
    return fail('Only pending revisions can be rejected');
  }
  if (user.role !== 'Admin' && user.role !== 'Senior') {
    return fail('Only admins and senior users can reject revisions');
  }
  if (user.role === 'Senior' && (!rejectionNote || rejectionNote.trim().length === 0)) {
    return fail('Senior users must provide a rejection note');
  }
  return ok();
}

export function shouldAutoApprove(agreementCount: number): boolean {
  return agreementCount >= SYSTEM_CONFIG.AGREEMENT_THRESHOLD;
}

export type CompetingRevisionPolicy = 'reject' | 'keep';

export function getCompetingRevisionPolicy(isMinorChange: boolean): CompetingRevisionPolicy {
  return isMinorChange ? 'keep' : 'reject';
}
