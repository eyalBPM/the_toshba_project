'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MinorChangeRequest {
  id: string;
  message: string;
  status: string;
  requestedBy: { id: string; name: string };
  reviewNote: string | null;
  createdAt: string;
}

interface MinorChangeReviewProps {
  revisionId: string;
  userRole: string;
}

export function MinorChangeReview({ revisionId, userRole }: MinorChangeReviewProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<MinorChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/revisions/${revisionId}/minor-change`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setRequests(json.data ?? []))
      .finally(() => setLoading(false));
  }, [revisionId]);

  if (userRole !== 'Admin') return null;

  const pendingRequests = requests.filter((r) => r.status === 'Pending');
  if (loading || pendingRequests.length === 0) return null;

  async function handleAction(requestId: string, action: 'approve' | 'reject') {
    setError('');
    setActing(requestId);
    try {
      const res = await fetch(
        `/api/revisions/${revisionId}/minor-change/${requestId}/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      if (res.ok) {
        router.refresh();
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה');
      }
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-2" dir="rtl">
      <p className="text-sm font-medium text-amber-800">בקשות שינוי מינורי</p>
      {pendingRequests.map((req) => (
        <div
          key={req.id}
          className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm"
        >
          <p className="mb-1 text-xs text-gray-500">
            {req.requestedBy.name} ·{' '}
            {new Date(req.createdAt).toLocaleDateString('he-IL')}
          </p>
          <p className="mb-2 text-gray-700">{req.message}</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(req.id, 'approve')}
              disabled={acting === req.id}
              className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
            >
              אשר
            </button>
            <button
              onClick={() => handleAction(req.id, 'reject')}
              disabled={acting === req.id}
              className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
            >
              דחה
            </button>
          </div>
        </div>
      ))}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
