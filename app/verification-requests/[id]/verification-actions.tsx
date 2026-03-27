'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function VerificationActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState('');

  async function handleAction(action: 'approve' | 'reject') {
    setError('');
    setLoading(action);
    try {
      const res = await fetch(`/api/verification-requests/${requestId}/${action}`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? 'אירעה שגיאה');
        return;
      }
      router.push('/verification-requests');
      router.refresh();
    } catch {
      setError('אירעה שגיאה');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-6 flex gap-3">
      <button
        onClick={() => handleAction('approve')}
        disabled={loading !== null}
        className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading === 'approve' ? 'מאשר...' : 'אשר'}
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
        className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading === 'reject' ? 'דוחה...' : 'דחה'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
