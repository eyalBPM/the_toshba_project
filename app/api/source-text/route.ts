import { NextRequest } from 'next/server';
import { apiSuccess, ApiErrors } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');
  if (!path) {
    return ApiErrors.badRequest('Missing "path" query parameter');
  }

  try {
    const res = await fetch(
      `https://www.sefaria.org/api/texts/${encodeURIComponent(path)}?lang=he&context=0`,
    );

    if (!res.ok) {
      return ApiErrors.badRequest(`Sefaria returned status ${res.status}`);
    }

    const data = await res.json();
    const heArr = data?.he;
    const heText = Array.isArray(heArr) ? heArr.join(' ') : (heArr ?? '');
    const cleaned = String(heText).replace(/<[^>]+>/g, '').trim();

    return apiSuccess({ text: cleaned });
  } catch {
    return ApiErrors.internal('Failed to fetch from Sefaria');
  }
}
