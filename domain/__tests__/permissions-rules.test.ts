import { describe, it, expect } from 'vitest';
import {
  canCreateRevision,
  canAgreeOnRevision,
  canWriteResponse,
  canApproveRevision,
  canRejectRevision,
  canApproveImage,
  canApproveMinorChange,
  canMergeTopicsAndSages,
  canManageRoles,
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

  describe('role-based (hierarchy: Admin > Senior > Moderator > User)', () => {
    it('canApproveRevision: Admin and Senior', () => {
      expect(canApproveRevision('Admin')).toBe(true);
      expect(canApproveRevision('Senior')).toBe(true);
      expect(canApproveRevision('Moderator')).toBe(false);
      expect(canApproveRevision('User')).toBe(false);
    });

    it('canRejectRevision: Admin and Senior', () => {
      expect(canRejectRevision('Admin')).toBe(true);
      expect(canRejectRevision('Senior')).toBe(true);
      expect(canRejectRevision('Moderator')).toBe(false);
      expect(canRejectRevision('User')).toBe(false);
    });

    it('canApproveImage: Admin, Senior and Moderator', () => {
      expect(canApproveImage('Admin')).toBe(true);
      expect(canApproveImage('Senior')).toBe(true);
      expect(canApproveImage('Moderator')).toBe(true);
      expect(canApproveImage('User')).toBe(false);
    });

    it('canApproveMinorChange: Admin, Senior and Moderator', () => {
      expect(canApproveMinorChange('Admin')).toBe(true);
      expect(canApproveMinorChange('Senior')).toBe(true);
      expect(canApproveMinorChange('Moderator')).toBe(true);
      expect(canApproveMinorChange('User')).toBe(false);
    });

    it('canMergeTopicsAndSages: Admin, Senior and Moderator', () => {
      expect(canMergeTopicsAndSages('Admin')).toBe(true);
      expect(canMergeTopicsAndSages('Senior')).toBe(true);
      expect(canMergeTopicsAndSages('Moderator')).toBe(true);
      expect(canMergeTopicsAndSages('User')).toBe(false);
    });

    it('canManageRoles: Admin only', () => {
      expect(canManageRoles('Admin')).toBe(true);
      expect(canManageRoles('Senior')).toBe(false);
      expect(canManageRoles('Moderator')).toBe(false);
      expect(canManageRoles('User')).toBe(false);
    });
  });
});
