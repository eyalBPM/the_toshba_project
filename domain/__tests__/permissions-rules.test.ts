import { describe, it, expect } from 'vitest';
import {
  canCreateRevision,
  canAgreeOnRevision,
  canWriteResponse,
  canApproveRevision,
  canRejectRevision,
  canApproveImage,
  canApproveMinorChange,
  canGrantSeniorRole,
} from '../permissions/rules';

describe('permissions', () => {
  describe('status-based', () => {
    it('canCreateRevision: true for VerifiedUser', () => {
      expect(canCreateRevision('VerifiedUser')).toBe(true);
    });

    it('canCreateRevision: false for PendingVerification', () => {
      expect(canCreateRevision('PendingVerification')).toBe(false);
    });

    it('canAgreeOnRevision: true for VerifiedUser', () => {
      expect(canAgreeOnRevision('VerifiedUser')).toBe(true);
    });

    it('canAgreeOnRevision: false for PendingVerification', () => {
      expect(canAgreeOnRevision('PendingVerification')).toBe(false);
    });

    it('canWriteResponse: true for VerifiedUser', () => {
      expect(canWriteResponse('VerifiedUser')).toBe(true);
    });

    it('canWriteResponse: false for PendingVerification', () => {
      expect(canWriteResponse('PendingVerification')).toBe(false);
    });
  });

  describe('role-based', () => {
    it('canApproveRevision: true for Admin only', () => {
      expect(canApproveRevision('Admin')).toBe(true);
      expect(canApproveRevision('User')).toBe(false);
      expect(canApproveRevision('Senior')).toBe(false);
      expect(canApproveRevision('Moderator')).toBe(false);
    });

    it('canRejectRevision: true for Admin and Senior', () => {
      expect(canRejectRevision('Admin')).toBe(true);
      expect(canRejectRevision('Senior')).toBe(true);
      expect(canRejectRevision('User')).toBe(false);
      expect(canRejectRevision('Moderator')).toBe(false);
    });

    it('canApproveImage: true for Admin only', () => {
      expect(canApproveImage('Admin')).toBe(true);
      expect(canApproveImage('User')).toBe(false);
      expect(canApproveImage('Senior')).toBe(false);
    });

    it('canApproveMinorChange: true for Admin only', () => {
      expect(canApproveMinorChange('Admin')).toBe(true);
      expect(canApproveMinorChange('User')).toBe(false);
      expect(canApproveMinorChange('Senior')).toBe(false);
    });

    it('canGrantSeniorRole: true for Senior only', () => {
      expect(canGrantSeniorRole('Senior')).toBe(true);
      expect(canGrantSeniorRole('Admin')).toBe(false);
      expect(canGrantSeniorRole('User')).toBe(false);
    });
  });
});
