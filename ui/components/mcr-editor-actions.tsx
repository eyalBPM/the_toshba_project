'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from './confirm-dialog';

interface McrEditorActionsProps {
  revisionId: string;
  mcrId?: string;
  buildPayload: () => { title: string; content: object; snapshot: unknown };
}

export function McrEditorActions({ revisionId, mcrId, buildPayload }: McrEditorActionsProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showRaceDialog, setShowRaceDialog] = useState(false);
  const [racePayload, setRacePayload] = useState<object | null>(null);

  async function handleSubmitMcr() {
    setError('');
    setSubmitting(true);
    try {
      const { title, content, snapshot } = buildPayload();
      const body = {
        title,
        content,
        snapshotData: snapshot,
        message: message || undefined,
      };

      if (mcrId) {
        // Updating existing MCR
        const res = await fetch(
          `/api/revisions/${revisionId}/minor-change/${mcrId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        );
        if (!res.ok) {
          const json = await res.json();
          if (json.error?.code === 'CONFLICT') {
            // Race condition: MCR was approved/rejected while editing
            setRacePayload(body);
            setShowRaceDialog(true);
            return;
          }
          setError(json.error?.message ?? 'שגיאה בשמירה');
          return;
        }
      } else {
        // Creating new MCR
        const res = await fetch(`/api/revisions/${revisionId}/minor-change`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const json = await res.json();
          setError(json.error?.message ?? 'שגיאה ביצירת בקשה');
          return;
        }
      }

      router.back();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateNewMcrAfterRace() {
    setShowRaceDialog(false);
    if (!racePayload) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/revisions/${revisionId}/minor-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(racePayload),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה ביצירת בקשה');
        return;
      }
      router.back();
      router.refresh();
    } finally {
      setSubmitting(false);
      setRacePayload(null);
    }
  }

  return (
    <>
      {/* Optional message */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          הסבר השינוי (אופציונלי)
        </label>
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="תאר בקצרה את השינוי שביצעת..."
          dir="rtl"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4">
        <button
          onClick={handleSubmitMcr}
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'שולח...' : 'שלח בקשה לשינוי מינורי'}
        </button>
        <button
          onClick={() => router.back()}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          ביטול
        </button>
      </div>

      {/* Race condition dialog */}
      <ConfirmDialog
        open={showRaceDialog}
        onClose={() => setShowRaceDialog(false)}
        title="הבקשה כבר טופלה"
        actions={[
          {
            label: 'כן, שמור כבקשה חדשה',
            onClick: handleCreateNewMcrAfterRace,
            variant: 'primary',
          },
          {
            label: 'ביטול',
            onClick: () => {
              setShowRaceDialog(false);
              setRacePayload(null);
            },
            variant: 'secondary',
          },
        ]}
      >
        <p>
          בזמן שערכת את הבקשה, הבקשה כבר התקבלה או נדחתה. האם תרצה לשמור בקשה זו
          כבקשה חדשה?
        </p>
      </ConfirmDialog>
    </>
  );
}
