import { getCachedSources } from '@/lib/sources-cache';
import { apiSuccess, ApiErrors } from '@/lib/api-error';

export async function GET() {
  try {
    const sources = await getCachedSources();
    return apiSuccess(sources);
  } catch {
    return ApiErrors.internal();
  }
}
