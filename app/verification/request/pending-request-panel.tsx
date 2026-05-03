'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  requestId: string;
  verifierName: string;
  message: string;
  createdAt: string;
}

export function PendingRequestPanel({ requestId, verifierName, message, createdAt }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleCancel() {
    if (!confirm('לבטל את בקשת האימות? תוכל לשלוח בקשה חדשה לאחר הביטול.')) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/verification-requests/${requestId}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error?.message ?? 'אירעה שגיאה');
        return;
      }
      router.refresh();
    } catch {
      setError('אירעה שגיאה');
    } finally {
      setSubmitting(false);
    }
  }

  const created = new Date(createdAt).toLocaleString('he-IL');

  return (
    <div className="space-y-4 rounded-md border border-amber-200 bg-amber-50 p-4">
      <div>
        <p className="text-sm text-amber-900">בקשת אימות ממתינה.</p>
      </div>
      <div className="space-y-2 text-sm text-gray-700">
        <div>
          <span className="font-medium">מאמת:</span> {verifierName}
        </div>
        <div>
          <span className="font-medium">נשלחה:</span> {created}
        </div>
        <div>
          <span className="font-medium">הודעה:</span>
          <p className="mt-1 whitespace-pre-wrap rounded bg-white p-2 text-gray-800">{message}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? 'מבטל...' : 'בטל בקשה'}
        </button>
        <p className="self-center text-xs text-gray-500">או המתן עד שהמאמת יענה על הבקשה.</p>
      </div>
    </div>
  );
}
