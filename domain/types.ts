// ─── Result Type ────────────────────────────────────────

export type Result = { success: true } | { success: false; error: string };

export function ok(): Result {
  return { success: true };
}

export function fail(error: string): Result {
  return { success: false, error };
}

// ─── Enums (pure TS, no Prisma imports) ─────────────────

export type UserStatus = 'PendingVerification' | 'VerifiedUser';

export type UserRole = 'User' | 'Admin' | 'Moderator' | 'Senior';

export type RevisionStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

export type VerificationRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export type ImageStatus = 'PendingApproval' | 'Approved' | 'Rejected';

export type MinorChangeRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Used';

export type ClusterVisibility = 'Private' | 'Shared' | 'Public';

// ─── Minimal Entity Interfaces ──────────────────────────

export interface DomainUser {
  id: string;
  status: UserStatus;
  role: UserRole;
}

export interface DomainRevision {
  id: string;
  articleId: string | null;
  status: RevisionStatus;
  createdByUserId: string;
}

export interface DomainCluster {
  id: string;
  ownerUserId: string;
  visibility: ClusterVisibility;
}

export interface DomainOpinionResponse {
  id: string;
  clusterId: string;
  revisionId: string;
  userId: string;
}

export interface DomainVerificationRequest {
  id: string;
  requestingUserId: string;
  requestedVerifierId: string;
  status: VerificationRequestStatus;
}
