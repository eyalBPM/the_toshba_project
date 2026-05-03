import type { RevisionStatus } from '../types';

const ACTIVE_STATUSES: ReadonlySet<RevisionStatus> = new Set(['Draft', 'Pending']);

export function isActiveRevisionStatus(status: RevisionStatus): boolean {
  return ACTIVE_STATUSES.has(status);
}

export function countsTowardActiveLimit(
  status: RevisionStatus,
  articleId: string | null,
): boolean {
  return articleId !== null && isActiveRevisionStatus(status);
}
