import { apiSuccess, ApiErrors } from '@/lib/api-error';
import {
  listAgreementsByRevision,
  countAgreementsByRevision,
} from '@/db/agreement-repository';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: revisionId } = await params;

    const [agreements, count] = await Promise.all([
      listAgreementsByRevision(revisionId),
      countAgreementsByRevision(revisionId),
    ]);

    return apiSuccess({ agreements, count });
  } catch {
    return ApiErrors.internal();
  }
}
