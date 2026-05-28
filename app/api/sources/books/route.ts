import { getCachedBooks } from '@/lib/books-cache';
import { apiSuccess, ApiErrors } from '@/lib/api-error';

export async function GET() {
  try {
    const books = await getCachedBooks();
    return apiSuccess(books);
  } catch {
    return ApiErrors.internal();
  }
}
