import Link from 'next/link';
import { listPendingImages } from '@/db/image-repository';
import { ImageActions } from '@/ui/components/admin/image-actions';

export default async function AdminImagesPage() {
  const images = await listPendingImages();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">תמונות ממתינות לאישור</h1>

      {images.length === 0 ? (
        <p className="text-gray-500">אין תמונות ממתינות.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              <Link href={`/admin/images/${img.id}`}>
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <img
                    src={img.url}
                    alt="pending image"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </Link>
              <div className="p-3">
                <p className="text-xs text-gray-500">
                  {img.uploadedBy.name} ·{' '}
                  {new Date(img.createdAt).toLocaleDateString('he-IL')}
                </p>
                <p className="text-xs text-gray-400">גרסה: {img.revision.title}</p>
                <div className="mt-2">
                  <ImageActions imageId={img.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
