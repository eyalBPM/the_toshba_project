'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MinorChangeActionsProps {
  revisionId: string;
  requestId: string;
}

export function MinorChangeActions({ revisionId, requestId }: MinorChangeActionsProps) {
  const router = useRouter();
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  async function handleAction(action: 'approve' | 'reject') {
    setError('');
    setActing(true);
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
      } else {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה');
      }
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="flex items-center gap-2" dir="rtl">
      <button
        onClick={() => handleAction('approve')}
        disabled={acting}
        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
      >
        אשר
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={acting}
        className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
      >
        דחה
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
