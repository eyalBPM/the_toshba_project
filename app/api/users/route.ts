import type { NextRequest } from 'next/server';
import { listUsers } from '@/db/user-repository';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import type { UserStatus } from '@/db/generated/prisma/enums';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') ?? undefined;
    const status = (searchParams.get('status') ?? undefined) as UserStatus | undefined;
    const users = await listUsers({ search, status });
    return apiSuccess(
      users.map((u) => ({ id: u.id, name: u.name, email: u.email, status: u.status, role: u.role })),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}
