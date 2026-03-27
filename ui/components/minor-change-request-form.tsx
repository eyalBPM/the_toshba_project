'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MinorChangeRequestFormProps {
  revisionId: string;
}

export function MinorChangeRequestForm({ revisionId }: MinorChangeRequestFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (message.trim().length < 5) {
      setError('יש להוסיף תיאור של לפחות 5 תווים');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/revisions/${revisionId}/minor-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (res.ok) {
        setOpen(false);
        setMessage('');
        router.refresh();
      } else {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה בשליחת הבקשה');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-200"
      >
        בקשת שינוי מינורי
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3" dir="rtl">
      <p className="text-sm font-medium text-amber-800">בקשת שינוי מינורי</p>
      <p className="text-xs text-amber-600">
        תאר את השינוי המבוקש. אם יאושר על ידי מנהל, תוכל לערוך ללא איפוס ההסכמות.
      </p>
      <textarea
        className="w-full rounded border border-amber-300 px-2 py-1 text-sm"
        rows={3}
        placeholder="תיאור השינוי..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded bg-amber-600 px-3 py-1 text-xs text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {submitting ? 'שולח...' : 'שלח בקשה'}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setMessage('');
            setError('');
          }}
          className="rounded bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200"
        >
          ביטול
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
