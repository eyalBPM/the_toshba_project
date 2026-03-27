import { describe, it, expect } from 'vitest';
import {
  canEditResponse,
  canDeleteResponse,
  canViewCluster,
  canEditCluster,
  canManageClusterAccess,
} from '../opinion/rules';
import type { DomainCluster, DomainOpinionResponse, ClusterVisibility } from '../types';

function makeCluster(overrides: Partial<DomainCluster> = {}): DomainCluster {
  return {
    id: 'cluster-1',
    ownerUserId: 'owner-1',
    visibility: 'Private',
    ...overrides,
  };
}

function makeResponse(overrides: Partial<DomainOpinionResponse> = {}): DomainOpinionResponse {
  return {
    id: 'resp-1',
    clusterId: 'cluster-1',
    revisionId: 'rev-1',
    userId: 'user-1',
    ...overrides,
  };
}

describe('opinion rules', () => {
  describe('canEditResponse', () => {
    it('allows the response author', () => {
      expect(canEditResponse(makeResponse(), 'user-1')).toEqual({ success: true });
    });

    it('rejects non-author', () => {
      const result = canEditResponse(makeResponse(), 'other-user');
      expect(result.success).toBe(false);
    });
  });

  describe('canDeleteResponse', () => {
    it('allows the response author', () => {
      expect(canDeleteResponse(makeResponse(), 'user-1')).toEqual({ success: true });
    });

    it('rejects non-author', () => {
      const result = canDeleteResponse(makeResponse(), 'other-user');
      expect(result.success).toBe(false);
    });
  });

  describe('canViewCluster', () => {
    it('allows anyone to view Public cluster', () => {
      const cluster = makeCluster({ visibility: 'Public' });
      expect(canViewCluster(cluster, 'random-user', false)).toEqual({ success: true });
    });

    it('allows owner to view Private cluster', () => {
      expect(canViewCluster(makeCluster(), 'owner-1', false)).toEqual({ success: true });
    });

    it('rejects non-owner from Private cluster', () => {
      const result = canViewCluster(makeCluster(), 'other-user', false);
      expect(result.success).toBe(false);
    });

    it('allows owner to view Shared cluster', () => {
      const cluster = makeCluster({ visibility: 'Shared' });
      expect(canViewCluster(cluster, 'owner-1', false)).toEqual({ success: true });
    });

    it('allows user with access to view Shared cluster', () => {
      const cluster = makeCluster({ visibility: 'Shared' });
      expect(canViewCluster(cluster, 'other-user', true)).toEqual({ success: true });
    });

    it('rejects user without access from Shared cluster', () => {
      const cluster = makeCluster({ visibility: 'Shared' });
      const result = canViewCluster(cluster, 'other-user', false);
      expect(result.success).toBe(false);
    });

    it('allows owner of Shared cluster even without explicit access entry', () => {
      const cluster = makeCluster({ visibility: 'Shared' });
      // Owner passes via ownerUserId check, not via hasAccess
      expect(canViewCluster(cluster, 'owner-1', false)).toEqual({ success: true });
    });
  });

  describe('canEditCluster', () => {
    it('allows the cluster owner', () => {
      expect(canEditCluster(makeCluster(), 'owner-1')).toEqual({ success: true });
    });

    it('rejects non-owner', () => {
      const result = canEditCluster(makeCluster(), 'other-user');
      expect(result.success).toBe(false);
    });
  });

  describe('canManageClusterAccess', () => {
    it('allows the cluster owner', () => {
      expect(canManageClusterAccess(makeCluster(), 'owner-1')).toEqual({ success: true });
    });

    it('rejects non-owner', () => {
      const result = canManageClusterAccess(makeCluster(), 'other-user');
      expect(result.success).toBe(false);
    });
  });
});
