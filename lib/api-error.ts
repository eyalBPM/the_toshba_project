import { NextResponse } from 'next/server';
import type { ApiErrorDetail, ApiErrorResponse, ApiSuccessResponse } from './api-types';

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true as const, data }, { status });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>,
): NextResponse<ApiErrorResponse> {
  const error: ApiErrorDetail = { code, message };
  if (details) error.details = details;
  return NextResponse.json({ success: false as const, error }, { status });
}

export const ApiErrors = {
  notFound: (message = 'Resource not found') => apiError('NOT_FOUND', message, 404),
  unauthorized: (message = 'Unauthorized') => apiError('UNAUTHORIZED', message, 401),
  forbidden: (message = 'Forbidden') => apiError('FORBIDDEN', message, 403),
  badRequest: (message: string, details?: Record<string, unknown>) =>
    apiError('BAD_REQUEST', message, 400, details),
  validationError: (message: string, details?: Record<string, unknown>) =>
    apiError('VALIDATION_ERROR', message, 422, details),
  conflict: (message: string) => apiError('CONFLICT', message, 409),
  internal: (message = 'Internal server error') => apiError('INTERNAL_ERROR', message, 500),
} as const;
