import { auth } from './auth';
import type { UserRole, UserStatus } from '@/domain/types';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  role: UserRole;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export async function requireVerified(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.status !== 'VerifiedUser') {
    throw new Error('FORBIDDEN');
  }
  return user;
}
