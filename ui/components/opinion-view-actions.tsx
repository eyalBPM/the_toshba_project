'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OpinionViewActionsProps {
  responseId: string;
  editHref: string;
  initialPublished: boolean;
  clusterVisibility: 'Private' | 'Shared' | 'Public';
}

const EDIT_CONFIRM_MESSAGE =
  'כאשר אתה עובר למצב עריכה, הדעה הזו תהיה מוסתרת מהקהילה, עד לאחר שתסיים לערוך, תצא ממצב עריכה, ותאשר פרסום';

export function OpinionViewActions({
  responseId,
  editHref,
  initialPublished,
  clusterVisibility,
}: OpinionViewActionsProps) {
  const router = useRouter();
  const [published, setPublished] = useState(initialPublished);
  const [busy, setBusy] = useState<'publish' | 'unpublish' | 'edit' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patchPublished(next: boolean): Promise<boolean> {
    const res = await fetch(`/api/opinions/${responseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: next }),
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = `שגיאה (HTTP ${res.status})`;
      try {
        const j = JSON.parse(text) as { error?: { message?: string } };
        if (j.error?.message) msg = j.error.message;
      } catch { /* not JSON */ }
      setError(msg);
      return false;
    }
    setPublished(next);
    return true;
  }

  async function handlePublish() {
    setError(null);
    setBusy('publish');
    try {
      if (await patchPublished(true)) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleUnpublish() {
    setError(null);
    setBusy('unpublish');
    try {
      if (await patchPublished(false)) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleEdit() {
    setError(null);
    // Confirmation only when currently visible to the community.
    if (published && clusterVisibility !== 'Private') {
      if (!confirm(EDIT_CONFIRM_MESSAGE)) return;
    }
    setBusy('edit');
    try {
      // If published, unpublish first so the response is hidden during editing.
      if (published) {
        if (!(await patchPublished(false))) return;
      }
      router.push(editHref);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {published ? (
          <button
            onClick={handleUnpublish}
            disabled={busy !== null}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy === 'unpublish' ? 'מבטל פרסום...' : 'בטל פרסום'}
          </button>
        ) : (
          <button
            onClick={handlePublish}
            disabled={busy !== null}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {busy === 'publish' ? 'מפרסם...' : 'פרסם'}
          </button>
        )}
        <button
          onClick={handleEdit}
          disabled={busy !== null}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy === 'edit' ? 'פותח עריכה...' : 'ערוך'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
