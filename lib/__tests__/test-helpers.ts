import type {
  DomainUser,
  DomainRevision,
  DomainCluster,
  DomainOpinionResponse,
  DomainVerificationRequest,
} from '@/domain/types';

export function makeUser(overrides: Partial<DomainUser> = {}): DomainUser {
  return {
    id: 'user-1',
    status: 'VerifiedUser',
    role: 'User',
    ...overrides,
  };
}

export function makeRevision(overrides: Partial<DomainRevision> = {}): DomainRevision {
  return {
    id: 'rev-1',
    articleId: 'art-1',
    status: 'Pending',
    createdByUserId: 'user-1',
    ...overrides,
  };
}

export function makeCluster(overrides: Partial<DomainCluster> = {}): DomainCluster {
  return {
    id: 'cluster-1',
    ownerUserId: 'owner-1',
    visibility: 'Private',
    ...overrides,
  };
}

export function makeOpinionResponse(
  overrides: Partial<DomainOpinionResponse> = {},
): DomainOpinionResponse {
  return {
    id: 'resp-1',
    clusterId: 'cluster-1',
    revisionId: 'rev-1',
    userId: 'user-1',
    ...overrides,
  };
}

export function makeVerificationRequest(
  overrides: Partial<DomainVerificationRequest> = {},
): DomainVerificationRequest {
  return {
    id: 'vreq-1',
    requestingUserId: 'user-1',
    requestedVerifierId: 'verifier-1',
    status: 'Pending',
    ...overrides,
  };
}
