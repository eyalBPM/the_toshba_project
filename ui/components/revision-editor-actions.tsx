'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from './confirm-dialog';

interface RevisionEditorActionsProps {
  revisionId: string;
  status: string;
  deleteRedirectUrl: string;
  viewUrl: string;
  buildPayload: () => { title: string; content: object; snapshot: unknown };
}

export function RevisionEditorActions({
  revisionId,
  status,
  deleteRedirectUrl,
  viewUrl,
  buildPayload,
}: RevisionEditorActionsProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [retracting, setRetracting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showRetractDialog, setShowRetractDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  async function handleSubmit() {
    setShowSubmitDialog(false);
    setError('');
    setSubmitting(true);
    try {
      const saveRes = await fetch(`/api/revisions/${revisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (!saveRes.ok) {
        const json = await saveRes.json();
        setError(json.error?.message ?? 'שגיאה בשמירה');
        return;
      }
      const submitRes = await fetch(`/api/revisions/${revisionId}/submit`, {
        method: 'POST',
      });
      if (!submitRes.ok) {
        const json = await submitRes.json();
        setError(json.error?.message ?? 'שגיאה בהגשה');
        return;
      }
      router.push(viewUrl);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetract() {
    setShowRetractDialog(false);
    setError('');
    setRetracting(true);
    try {
      const res = await fetch(`/api/revisions/${revisionId}/retract`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה');
        return;
      }
      router.refresh();
    } finally {
      setRetracting(false);
    }
  }

  async function handleDelete() {
    setShowDeleteDialog(false);
    setError('');
    setDeleting(true);
    try {
      const res = await fetch(`/api/revisions/${revisionId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה במחיקה');
        return;
      }
      router.push(deleteRedirectUrl);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4">
        {status === 'Draft' && (
          <>
            <button
              onClick={() => setShowSubmitDialog(true)}
              disabled={submitting}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'מגיש...' : 'הגש לבדיקה'}
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
              className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
            >
              {deleting ? 'מוחק...' : 'מחק טיוטה'}
            </button>
          </>
        )}

        {status === 'Pending' && (
          <button
            onClick={() => setShowRetractDialog(true)}
            disabled={retracting}
            className="rounded-md bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-200 disabled:opacity-50"
          >
            {retracting ? 'מחזיר...' : 'החזר לטיוטה'}
          </button>
        )}
      </div>

      {/* Submit confirmation dialog */}
      <ConfirmDialog
        open={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        title="האם אתה בטוח שהמאמר מוכן ומוגה היטב?"
        actions={[
          { label: 'הגש', onClick: handleSubmit, variant: 'primary' },
          { label: 'ביטול', onClick: () => setShowSubmitDialog(false), variant: 'secondary' },
        ]}
      >
        <p>
          כאשר את מציע את המאמר, הוא מתחיל ליצבור הסכמות מהקהילה. אם תרצה לשנות אותו
          לאחר מכן, המאמר עלול להפסיד את כל ההסכמות.
        </p>
      </ConfirmDialog>

      {/* Retract confirmation dialog */}
      <ConfirmDialog
        open={showRetractDialog}
        onClose={() => setShowRetractDialog(false)}
        title="החזרה לטיוטה"
        actions={[
          { label: 'כן, החזר לטיוטה', onClick: handleRetract, variant: 'warning' },
          { label: 'ביטול', onClick: () => setShowRetractDialog(false), variant: 'secondary' },
        ]}
      >
        <p>כל ההסכמות ובקשות השינוי המינורי יימחקו. להמשיך?</p>
      </ConfirmDialog>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="מחיקת טיוטה"
        actions={[
          { label: 'כן, מחק', onClick: handleDelete, variant: 'danger' },
          { label: 'ביטול', onClick: () => setShowDeleteDialog(false), variant: 'secondary' },
        ]}
      >
        <p>הטיוטה תימחק לצמיתות. להמשיך?</p>
      </ConfirmDialog>
    </>
  );
}
