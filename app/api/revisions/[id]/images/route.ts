import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { uploadImage } from '@/application/image/upload-image';
import { listImagesByRevision } from '@/db/image-repository';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: revisionId } = await params;
    const images = await listImagesByRevision(revisionId);
    return apiSuccess(images);
  } catch {
    return ApiErrors.internal();
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id: revisionId } = await params;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return ApiErrors.badRequest('No file provided');
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return ApiErrors.badRequest('File type not allowed. Use JPG, PNG, WebP, or GIF.');
    }

    if (file.size > MAX_SIZE) {
      return ApiErrors.badRequest('File too large. Maximum size is 5MB.');
    }

    // Save file to filesystem
    const ext = EXT_MAP[file.type] ?? 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const relativeUrl = `/uploads/images/${filename}`;
    const absolutePath = path.join(process.cwd(), 'public', relativeUrl);

    // Ensure directory exists
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absolutePath, buffer);

    // Create DB record
    const image = await uploadImage({
      user: { id: user.id, status: user.status, role: user.role },
      revisionId,
      url: relativeUrl,
    });

    return apiSuccess(image, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Revision not found') return ApiErrors.notFound(msg);
    if (msg.includes('Only')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}
