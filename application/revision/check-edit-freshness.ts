import type { DomainUser, RevisionStatus } from '@/domain/types';
import { checkRevisionFreshness, type FreshnessCheckResult } from '@/domain/revision/editing';
import { findRevisionStatusById } from '@/db/revision-repository';
import { countAgreementsByRevision } from '@/db/agreement-repository';
import { findPendingRequestByRevision } from '@/db/minor-change-repository';

export interface CheckEditFreshnessInput {
  user: DomainUser;
  revisionId: string;
}

export interface EditFreshnessResult extends FreshnessCheckResult {
  currentStatus: string;
  hasPendingMcr: boolean;
  pendingMcrId: string | null;
  agreementCount: number;
}

export async function checkEditFreshness(
  input: CheckEditFreshnessInput,
): Promise<EditFreshnessResult> {
  const revision = await findRevisionStatusById(input.revisionId);
  if (!revision) {
    return {
      editable: false,
      reason: 'not_found',
      currentStatus: 'unknown',
      hasPendingMcr: false,
      pendingMcrId: null,
      agreementCount: 0,
    };
  }

  const isOwner = revision.createdByUserId === input.user.id;
  const freshness = checkRevisionFreshness(
    revision.status as RevisionStatus,
    isOwner,
    revision.article?.slug,
  );

  const [agreementCount, pendingMcr] = await Promise.all([
    countAgreementsByRevision(input.revisionId),
    findPendingRequestByRevision(input.revisionId),
  ]);

  return {
    ...freshness,
    currentStatus: revision.status,
    hasPendingMcr: !!pendingMcr,
    pendingMcrId: pendingMcr?.id ?? null,
    agreementCount,
  };
}
