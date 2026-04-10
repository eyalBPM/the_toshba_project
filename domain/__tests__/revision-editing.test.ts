import { describe, it, expect } from 'vitest';
import {
  getEditPolicy,
  canEditRevision,
  isEditableStatus,
  checkRevisionFreshness,
} from '../revision/editing';
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
      expect(getEditPolicy(0)).toEqual({
        willResetAgreements: false,
        requiresWarning: false,
      });
    });

    it('returns reset and warning when agreements > 0', () => {
      expect(getEditPolicy(5)).toEqual({
        willResetAgreements: true,
        requiresWarning: true,
      });
    });

    it('resets agreements at exactly 1 agreement', () => {
      expect(getEditPolicy(1)).toEqual({
        willResetAgreements: true,
        requiresWarning: true,
      });
    });
  });

  describe('isEditableStatus', () => {
    it('returns true for Draft', () => {
      expect(isEditableStatus('Draft')).toBe(true);
    });

    it('returns true for Pending', () => {
      expect(isEditableStatus('Pending')).toBe(true);
    });

    it('returns false for Approved', () => {
      expect(isEditableStatus('Approved')).toBe(false);
    });

    it('returns false for Rejected', () => {
      expect(isEditableStatus('Rejected')).toBe(false);
    });

    it('returns false for Obsolete', () => {
      expect(isEditableStatus('Obsolete')).toBe(false);
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

    it('rejects edit of Obsolete revision', () => {
      const result = canEditRevision(makeRevision({ status: 'Obsolete' }), 'user-1');
      expect(result.success).toBe(false);
    });

    it('rejects edit by non-creator', () => {
      const result = canEditRevision(makeRevision(), 'other-user');
      expect(result.success).toBe(false);
    });
  });

  describe('checkRevisionFreshness', () => {
    it('returns editable for Draft by owner', () => {
      expect(checkRevisionFreshness('Draft', true)).toEqual({ editable: true });
    });

    it('returns editable for Pending by owner', () => {
      expect(checkRevisionFreshness('Pending', true)).toEqual({ editable: true });
    });

    it('returns not editable for Approved with article slug', () => {
      expect(checkRevisionFreshness('Approved', true, 'my-article')).toEqual({
        editable: false,
        reason: 'approved',
        articleSlug: 'my-article',
      });
    });

    it('returns not editable for Rejected', () => {
      expect(checkRevisionFreshness('Rejected', true)).toEqual({
        editable: false,
        reason: 'rejected',
      });
    });

    it('returns not editable for Obsolete with article slug', () => {
      expect(checkRevisionFreshness('Obsolete', true, 'my-article')).toEqual({
        editable: false,
        reason: 'obsolete',
        articleSlug: 'my-article',
      });
    });

    it('returns not editable for non-owner', () => {
      expect(checkRevisionFreshness('Draft', false)).toEqual({
        editable: false,
        reason: 'not_owner',
      });
    });
  });
});
