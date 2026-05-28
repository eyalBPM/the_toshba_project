'use client';

import { useState } from 'react';
import type { ArticlesViewConfig } from '@/domain/articles-list/view-config';
import type { ArticlesView } from '@/ui/hooks/use-articles-view-bundle';
import { SaveViewDialog } from './save-view-dialog';

interface Props {
  activeViewId: string | null;
  views: ArticlesView[];
  currentConfig: ArticlesViewConfig;
  isDirtyDefault: boolean;
  onAfterMutation: () => Promise<void>;
  // Replace the active view config in local state (used after a rename/delete
  // forces a snap back to the default view).
  onResetToDefault: () => void;
}

const DEFAULT_LABEL = 'ברירת מחדל';

export function ArticlesViewSwitcher({
  activeViewId,
  views,
  currentConfig,
  isDirtyDefault,
  onAfterMutation,
  onResetToDefault,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<null | 'create' | 'rename'>(null);

  const activeView = views.find((v) => v.id === activeViewId) ?? null;

  async function switchTo(id: string | null) {
    setBusy(true);
    try {
      await fetch('/api/user/settings/active-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableViewId: id }),
      });
      await onAfterMutation();
    } finally {
      setBusy(false);
    }
  }

  async function createView(name: string) {
    setBusy(true);
    try {
      const res = await fetch('/api/user/table-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config: currentConfig }),
      });
      if (!res.ok) return;
      const json = await res.json();
      const newId = json.data?.id as string | undefined;
      if (newId) {
        await fetch('/api/user/settings/active-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableViewId: newId }),
        });
      }
      await onAfterMutation();
    } finally {
      setBusy(false);
    }
  }

  async function renameView(name: string) {
    if (!activeView) return;
    setBusy(true);
    try {
      await fetch(`/api/user/table-views/${activeView.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      await onAfterMutation();
    } finally {
      setBusy(false);
    }
  }

  async function deleteView() {
    if (!activeView) return;
    if (!confirm(`למחוק את המבט "${activeView.name}"?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/user/table-views/${activeView.id}`, { method: 'DELETE' });
      onResetToDefault();
      await onAfterMutation();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs text-gray-500">מבט:</label>
      <select
        className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={activeViewId ?? ''}
        disabled={busy}
        onChange={(e) => switchTo(e.target.value === '' ? null : e.target.value)}
      >
        <option value="">{DEFAULT_LABEL}</option>
        {views.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>

      {isDirtyDefault && (
        <button
          type="button"
          className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={busy}
          onClick={() => setDialog('create')}
        >
          💾 שמור כמבט חדש
        </button>
      )}

      {activeView && (
        <>
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            disabled={busy}
            onClick={() => setDialog('rename')}
          >
            שנה שם
          </button>
          <button
            type="button"
            className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
            disabled={busy}
            onClick={deleteView}
          >
            מחק
          </button>
        </>
      )}

      <SaveViewDialog
        open={dialog === 'create'}
        title="שמור מבט חדש"
        onClose={() => setDialog(null)}
        onSubmit={createView}
      />
      <SaveViewDialog
        open={dialog === 'rename'}
        title="שנה שם למבט"
        initialName={activeView?.name ?? ''}
        onClose={() => setDialog(null)}
        onSubmit={renameView}
      />
    </div>
  );
}
