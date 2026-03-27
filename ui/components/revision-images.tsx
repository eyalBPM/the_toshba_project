'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ImageItem {
  id: string;
  url: string;
  status: string;
  createdAt: string;
  uploadedBy: { id: string; name: string };
}

interface RevisionImagesProps {
  revisionId: string;
  currentUserId: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  PendingApproval: 'ממתין לאישור',
  Approved: 'מאושר',
  Rejected: 'נדחה',
};

const STATUS_COLORS: Record<string, string> = {
  PendingApproval: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

export function RevisionImages({ revisionId, currentUserId }: RevisionImagesProps) {
  const router = useRouter();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/revisions/${revisionId}/images`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setImages(json.data ?? []))
      .finally(() => setLoading(false));
  }, [revisionId]);

  async function handleDelete(imageId: string) {
    if (!confirm('למחוק את התמונה?')) return;
    const res = await fetch(`/api/revisions/${revisionId}/images/${imageId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      router.refresh();
    }
  }

  if (loading || images.length === 0) return null;

  return (
    <div className="space-y-2" dir="rtl">
      <h3 className="text-sm font-semibold text-gray-700">תמונות</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="rounded-md border border-gray-200 bg-white overflow-hidden"
          >
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <img
                src={img.url}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="p-2">
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-xs ${STATUS_COLORS[img.status] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {STATUS_LABELS[img.status] ?? img.status}
              </span>
              {img.status === 'PendingApproval' &&
                img.uploadedBy.id === currentUserId && (
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="mr-2 text-xs text-red-500 hover:text-red-700"
                  >
                    מחק
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
