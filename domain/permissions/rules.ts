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

// ─── Role-based permissions ─────────────────────────────

export function canApproveRevision(role: UserRole): boolean {
  return role === 'Admin';
}

export function canRejectRevision(role: UserRole): boolean {
  return role === 'Admin' || role === 'Senior';
}

export function canApproveImage(role: UserRole): boolean {
  return role === 'Admin';
}

export function canApproveMinorChange(role: UserRole): boolean {
  return role === 'Admin';
}

export function canGrantSeniorRole(role: UserRole): boolean {
  return role === 'Senior';
}
