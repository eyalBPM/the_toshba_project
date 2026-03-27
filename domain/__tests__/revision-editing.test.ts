import { describe, it, expect } from 'vitest';
import { getEditPolicy, canEditRevision } from '../revision/editing';
import type { DomainRevision } from '../types';

function makeRevision(overrides: Partial<DomainRevision> = {}): DomainRevision {
  return {
    id: 'rev-1',
    articleId: null,
    status: 'Draft',
    createdByUserId: 'user-1',
    ...overrides,
  };
}

describe('revision editing', () => {
  describe('getEditPolicy', () => {
    it('returns no reset and no warning when 0 agreements', () => {
      expect(getEditPolicy(0, false)).toEqual({
        willResetAgreements: false,
        requiresWarning: false,
      });
    });

    it('returns reset and warning when agreements > 0', () => {
      expect(getEditPolicy(5, false)).toEqual({
        willResetAgreements: true,
        requiresWarning: true,
      });
    });

    it('returns no reset and no warning when minor change approved, even with agreements', () => {
      expect(getEditPolicy(10, true)).toEqual({
        willResetAgreements: false,
        requiresWarning: false,
      });
    });

    it('minor change approved with 0 agreements still returns no reset', () => {
      expect(getEditPolicy(0, true)).toEqual({
        willResetAgreements: false,
        requiresWarning: false,
      });
    });

    it('resets agreements at exactly 1 agreement without minor change', () => {
      expect(getEditPolicy(1, false)).toEqual({
        willResetAgreements: true,
        requiresWarning: true,
      });
    });

    it('preserves agreements at high count with minor change approved', () => {
      expect(getEditPolicy(34, true)).toEqual({
        willResetAgreements: false,
        requiresWarning: false,
      });
    });
  });

  describe('canEditRevision', () => {
    it('allows creator to edit Draft revision', () => {
      expect(canEditRevision(makeRevision(), 'user-1')).toEqual({ success: true });
    });

    it('allows creator to edit Pending revision', () => {
      expect(canEditRevision(makeRevision({ status: 'Pending' }), 'user-1')).toEqual({
        success: true,
      });
    });

    it('rejects edit of Approved revision', () => {
      const result = canEditRevision(makeRevision({ status: 'Approved' }), 'user-1');
      expect(result.success).toBe(false);
    });

    it('rejects edit of Rejected revision', () => {
      const result = canEditRevision(makeRevision({ status: 'Rejected' }), 'user-1');
      expect(result.success).toBe(false);
    });

    it('rejects edit by non-creator', () => {
      const result = canEditRevision(makeRevision(), 'other-user');
      expect(result.success).toBe(false);
    });
  });
});
