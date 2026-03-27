'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RevisionActionsProps {
  revisionId: string;
  userRole: string;
  revisionStatus: string;
}

export function RevisionActions({
  revisionId,
  userRole,
  revisionStatus,
}: RevisionActionsProps) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (revisionStatus !== 'Pending') return null;

  const isAdmin = userRole === 'Admin';
  const isSenior = userRole === 'Senior';

  if (!isAdmin && !isSenior) return null;

  async function handleApprove() {
    if (!confirm('לאשר את הגרסה?')) return;
    setError('');
    setApproving(true);
    try {
      const res = await fetch(`/api/revisions/${revisionId}/approve`, { method: 'POST' });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה באישור');
      }
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (isSenior && !note.trim()) {
      setError('חובה להוסיף הערה לדחייה');
      return;
    }
    setError('');
    setRejecting(true);
    try {
      const res = await fetch(`/api/revisions/${revisionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה בדחייה');
      }
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="space-y-2" dir="rtl">
      <div className="flex items-center gap-2">
        {isAdmin && (
          <button
            onClick={handleApprove}
            disabled={approving}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {approving ? 'מאשר...' : 'אשר גרסה'}
          </button>
        )}

        {!showRejectForm ? (
          <button
            onClick={() => setShowRejectForm(true)}
            className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
          >
            דחה
          </button>
        ) : (
          <div className="flex items-start gap-2">
            <div className="space-y-1">
              <textarea
                className="w-48 rounded border border-gray-300 px-2 py-1 text-sm"
                rows={2}
                placeholder={isSenior ? 'הערה (חובה)...' : 'הערה (אופציונלי)...'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex gap-1">
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {rejecting ? 'דוחה...' : 'אישור דחייה'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setNote('');
                  }}
                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
