import { notFound } from 'next/navigation';
import { findImageById } from '@/db/image-repository';
import { ImageActions } from '@/ui/components/admin/image-actions';

export default async function AdminImageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const image = await findImageById(id);
  if (!image) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">תמונה</h1>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gray-100 p-4 flex items-center justify-center">
          <img
            src={image.url}
            alt="image under review"
            className="max-h-96 max-w-full object-contain"
          />
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600">
            העלה: {image.uploadedBy.name} ·{' '}
            {new Date(image.createdAt).toLocaleDateString('he-IL')}
          </p>
          <p className="text-sm text-gray-500">גרסה: {image.revision.title}</p>
          <p className="mt-1 text-xs text-gray-400">סטטוס: {image.status}</p>

          {image.status === 'PendingApproval' && (
            <div className="mt-4">
              <ImageActions imageId={image.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
