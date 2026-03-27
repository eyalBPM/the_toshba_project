'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPicker } from '@/ui/components/user-picker';

export function VerificationRequestForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [verifierId, setVerifierId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!verifierId) {
      setError('יש לבחור מאמת');
      return;
    }
    if (message.trim().length < 10) {
      setError('ההודעה חייבת להכיל לפחות 10 תווים');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/verification-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedVerifierId: verifierId, message }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? 'אירעה שגיאה');
        return;
      }
      router.push(`/users/${userId}`);
    } catch {
      setError('אירעה שגיאה');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">בחר מאמת</label>
        <UserPicker value={verifierId} onChange={setVerifierId} placeholder="חפש משתמש מאומת..." />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">הודעה</label>
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="הצג את עצמך ופרט מדוע אתה מבקש אימות..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'שולח...' : 'שלח בקשה'}
      </button>
    </form>
  );
}
