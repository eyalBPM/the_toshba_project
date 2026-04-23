import type { UserStatus, UserRole } from '../types';

// ─── Status-based permissions ───────────────────────────

export function canCreateRevision(status: UserStatus): boolean {
  return status === 'VerifiedUser';
}

export function canAgreeOnRevision(status: UserStatus): boolean {
  return status === 'VerifiedUser';
}

export function canWriteResponse(status: UserStatus): boolean {
  return status === 'VerifiedUser';
}

// ─── Role-based permissions (hierarchical) ──────────────
// Hierarchy: Admin > Senior > Moderator > User.
// Each role inherits the permissions of the roles below it.

export function canApproveRevision(role: UserRole): boolean {
  return role === 'Admin' || role === 'Senior';
}

export function canRejectRevision(role: UserRole): boolean {
  return role === 'Admin' || role === 'Senior';
}

export function canApproveImage(role: UserRole): boolean {
  return role === 'Admin' || role === 'Senior' || role === 'Moderator';
}

export function canApproveMinorChange(role: UserRole): boolean {
  return role === 'Admin' || role === 'Senior' || role === 'Moderator';
}

export function canMergeTopicsAndSages(role: UserRole): boolean {
  return role === 'Admin' || role === 'Senior' || role === 'Moderator';
}

export function canManageRoles(role: UserRole): boolean {
  return role === 'Admin';
}
