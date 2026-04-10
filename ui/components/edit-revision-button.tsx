'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from './confirm-dialog';

interface EditRevisionButtonProps {
  revisionId: string;
  editUrl: string;
  className?: string;
  label?: string;
}

interface EditCheckResult {
  editable: boolean;
  currentStatus: string;
  reason?: string;
  articleSlug?: string;
  hasPendingMcr: boolean;
  pendingMcrId: string | null;
  agreementCount: number;
}

export function EditRevisionButton({
  revisionId,
  editUrl,
  className,
  label = 'ערוך',
}: EditRevisionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<EditCheckResult | null>(null);

  // Dialog states
  const [showStaleDialog, setShowStaleDialog] = useState(false);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [showMcrDialog, setShowMcrDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/revisions/${revisionId}/edit-check`);
      if (!res.ok) return;
      const json = await res.json();
      const result: EditCheckResult = json.data;
      setCheckResult(result);

      if (!result.editable) {
        setShowStaleDialog(true);
        return;
      }

      if (result.currentStatus === 'Draft') {
        router.push(editUrl);
        return;
      }

      if (result.currentStatus === 'Pending') {
        if (result.hasPendingMcr) {
          setShowMcrDialog(true);
        } else {
          setShowPendingDialog(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // --- Actions ---

  async function handleRetractAndEdit() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/revisions/${revisionId}/retract`, { method: 'POST' });
      if (!res.ok) return;
      router.push(editUrl);
    } finally {
      setActionLoading(false);
      setShowPendingDialog(false);
      setShowMcrDialog(false);
    }
  }

  function handleCreateMcr() {
    setShowPendingDialog(false);
    const separator = editUrl.includes('?') ? '&' : '?';
    router.push(`${editUrl}${separator}mode=mcr`);
  }

  function handleEditExistingMcr() {
    setShowMcrDialog(false);
    const separator = editUrl.includes('?') ? '&' : '?';
    router.push(`${editUrl}${separator}mode=mcr&mcrId=${checkResult?.pendingMcrId}`);
  }

  async function handleDeleteMcr() {
    if (!checkResult?.pendingMcrId) return;
    setActionLoading(true);
    try {
      await fetch(
        `/api/revisions/${revisionId}/minor-change/${checkResult.pendingMcrId}`,
        { method: 'DELETE' },
      );
      setShowMcrDialog(false);
    } finally {
      setActionLoading(false);
    }
  }

  const staleMessage = checkResult?.reason === 'approved'
    ? 'הגרסה אושרה והפכה למאמר.'
    : checkResult?.reason === 'rejected'
      ? 'הגרסה נדחתה.'
      : checkResult?.reason === 'obsolete'
        ? 'הגרסה הפכה למיושנת כיוון שגרסה מתחרה אושרה.'
        : 'הגרסה אינה ניתנת לעריכה.';

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className ?? 'rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'}
      >
        {loading ? '...' : label}
      </button>

      {/* Stale state dialog (section 10) */}
      <ConfirmDialog
        open={showStaleDialog}
        onClose={() => setShowStaleDialog(false)}
        title="לא ניתן לערוך"
        actions={[
          ...(checkResult?.articleSlug
            ? [{
                label: 'עבור למאמר',
                onClick: () => router.push(`/articles/${checkResult.articleSlug}`),
                variant: 'primary' as const,
              }]
            : []),
          { label: 'סגור', onClick: () => setShowStaleDialog(false), variant: 'secondary' },
        ]}
      >
        <p>{staleMessage}</p>
        {checkResult?.articleSlug && (
          <p className="mt-2 text-xs text-gray-500">
            שינויים עתידיים צריכים להיעשות דרך תהליך הצעת עדכון במאמר.
          </p>
        )}
      </ConfirmDialog>

      {/* Edit Pending dialog - 3 options (section 3) */}
      <ConfirmDialog
        open={showPendingDialog}
        onClose={() => setShowPendingDialog(false)}
        title="עריכת גרסה בהמתנה"
        actions={[
          {
            label: 'כן, החזר את המאמר לטיוטה ואבד את כל ההסכמות',
            onClick: handleRetractAndEdit,
            variant: 'danger',
            disabled: actionLoading,
          },
          {
            label: 'צור בקשה לשינוי מינורי',
            onClick: handleCreateMcr,
            variant: 'primary',
          },
          {
            label: 'לא, השאר את המאמר במצב הנוכחי',
            onClick: () => setShowPendingDialog(false),
            variant: 'secondary',
          },
        ]}
      >
        <p>
          לגרסה זו יש {checkResult?.agreementCount ?? 0} הסכמות. עריכה תאפס את כולן
          והגרסה תחזור למצב טיוטה.
        </p>
        <p className="mt-2">
          לחלופין, ניתן ליצור בקשה לשינוי מינורי שלא תאפס את ההסכמות.
        </p>
      </ConfirmDialog>

      {/* Edit with existing MCR dialog - 4 options (section 4) */}
      <ConfirmDialog
        open={showMcrDialog}
        onClose={() => setShowMcrDialog(false)}
        title="עריכת גרסה עם בקשת שינוי מינורי קיימת"
        actions={[
          {
            label: 'כן, חזור למצב טיוטה ואבד הסכמות ובקשה לשינוי מינורי',
            onClick: handleRetractAndEdit,
            variant: 'danger',
            disabled: actionLoading,
          },
          {
            label: 'ערוך בקשה לשינוי מינורי',
            onClick: handleEditExistingMcr,
            variant: 'primary',
          },
          {
            label: 'מחק בקשה לשינוי מינורי, והשאר את המאמר כמו שהוא',
            onClick: handleDeleteMcr,
            variant: 'warning',
            disabled: actionLoading,
          },
          {
            label: 'לא, השאר את המצב כמו שהוא',
            onClick: () => setShowMcrDialog(false),
            variant: 'secondary',
          },
        ]}
      >
        <p>
          לגרסה זו יש {checkResult?.agreementCount ?? 0} הסכמות ובקשת שינוי מינורי
          ממתינה.
        </p>
      </ConfirmDialog>
    </>
  );
}
