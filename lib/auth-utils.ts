import { auth } from './auth';
import { findUserById } from '@/db/user-repository';
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

  const dbUser = await findUserById(session.user.id);
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    status: dbUser.status as UserStatus,
    role: dbUser.role as UserRole,
  };
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
