import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { listUsers } from '@/db/user-repository';
import { parsePaginationParams, toPaginated } from '@/lib/pagination';
import type { UserStatus, UserRole } from '@/db/generated/prisma/enums';

export async function GET(request: NextRequest) {
  try {
    await requireRole('Admin');
    const url = new URL(request.url);
    const { cursor, limit } = parsePaginationParams(url);
    const search = url.searchParams.get('search') ?? undefined;
    const status = (url.searchParams.get('status') ?? undefined) as UserStatus | undefined;
    const role = (url.searchParams.get('role') ?? undefined) as UserRole | undefined;

    const users = await listUsers({ search, status, role, cursor, limit });
    return apiSuccess(toPaginated(users, limit));
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'FORBIDDEN') return ApiErrors.forbidden();
    return ApiErrors.internal();
  }
}
