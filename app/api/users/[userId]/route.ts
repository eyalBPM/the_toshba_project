import type { NextRequest } from 'next/server';
import { findUserById } from '@/db/user-repository';
import { findVerificationByUserId } from '@/db/verification-repository';
import { apiSuccess, ApiErrors } from '@/lib/api-error';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const user = await findUserById(userId);
    if (!user) return ApiErrors.notFound('User not found');

    const verification = await findVerificationByUserId(userId);

    return apiSuccess({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.role,
      verifiedBy: verification
        ? { id: verification.verifiedBy.id, name: verification.verifiedBy.name }
        : null,
      verifiedAt: verification?.createdAt ?? null,
    });
  } catch {
    return ApiErrors.internal();
  }
}
