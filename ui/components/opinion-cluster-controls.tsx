'use client';

import { useEffect, useMemo, useState } from 'react';

interface Cluster {
  id: string;
  title: string;
  introduction: string | null;
  visibility: string;
  ownerUserId: string;
  _count: { responses: number };
}

interface AccessUser {
  id: string;
  name: string;
}

interface Props {
  responseId: string;
  initialClusterId: string;
  onClusterChanged?: (newClusterId: string) => void;
}

type Mode = 'idle' | 'create' | 'edit' | 'delete';

const VISIBILITY_LABELS: Record<string, string> = {
  Private: 'פרטי',
  Shared: 'משותף',
  Public: 'ציבורי',
};

export function OpinionClusterControls({
  responseId,
  initialClusterId,
  onClusterChanged,
}: Props) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [currentClusterId, setCurrentClusterId] = useState(initialClusterId);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [mode, setMode] = useState<Mode>('idle');

  const [formTitle, setFormTitle] = useState('');
  const [formIntro, setFormIntro] = useState('');
  const [formVisibility, setFormVisibility] = useState('Private');
  const [formAccessUsers, setFormAccessUsers] = useState<AccessUser[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState('');

  const currentCluster = useMemo(
    () => clusters.find((c) => c.id === currentClusterId),
    [clusters, currentClusterId],
  );

  const otherClusters = useMemo(
    () => clusters.filter((c) => c.id !== currentClusterId),
    [clusters, currentClusterId],
  );

  useEffect(() => {
    let cancelled = false;
    fetch('/api/clusters')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        if (!cancelled) setClusters(json.data ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function clearMessages() {
    setError('');
    setInfo('');
  }

  function openCreate() {
    clearMessages();
    setFormTitle('');
    setFormIntro('');
    setFormVisibility('Private');
    setFormAccessUsers([]);
    setMode('create');
  }

  async function openEdit() {
    if (!currentCluster) return;
    clearMessages();
    setFormTitle(currentCluster.title);
    setFormIntro(currentCluster.introduction ?? '');
    setFormVisibility(currentCluster.visibility);
    setFormAccessUsers([]);
    setMode('edit');

    if (currentCluster.visibility === 'Shared') {
      try {
        const res = await fetch(`/api/clusters/${currentCluster.id}/access`);
        if (res.ok) {
          const json = await res.json();
          const list = (json.data ?? []) as Array<{ user: AccessUser }>;
          setFormAccessUsers(list.map((a) => a.user));
        }
      } catch {
        // non-fatal: leave list empty, user can re-add
      }
    }
  }

  function openDelete() {
    clearMessages();
    setDeleteTargetId(otherClusters[0]?.id ?? '');
    setMode('delete');
  }

  function cancel() {
    clearMessages();
    setMode('idle');
  }

  async function handleAssignCurrent(newClusterId: string) {
    if (newClusterId === currentClusterId) return;
    clearMessages();
    setBusy(true);
    try {
      const res = await fetch(`/api/opinions/${responseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clusterId: newClusterId }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה בשיוך מקבץ');
        return;
      }
      setCurrentClusterId(newClusterId);
      onClusterChanged?.(newClusterId);
      setInfo('המקבץ עודכן');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!formTitle.trim()) return;
    clearMessages();
    setBusy(true);
    try {
      const res = await fetch('/api/clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          introduction: formIntro.trim() || undefined,
          visibility: formVisibility,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? 'שגיאה ביצירה');
        return;
      }
      const created: Cluster = json.data;

      if (formVisibility === 'Shared' && formAccessUsers.length > 0) {
        const syncRes = await fetch(`/api/clusters/${created.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessUserIds: formAccessUsers.map((u) => u.id) }),
        });
        if (!syncRes.ok) {
          const syncJson = await syncRes.json();
          setError(syncJson.error?.message ?? 'המקבץ נוצר אך נכשל סנכרון משתמשים');
        }
      }

      setClusters((prev) => [created, ...prev]);
      setMode('idle');
      setInfo('המקבץ נוצר');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit() {
    if (!currentCluster) return;
    if (!formTitle.trim()) return;
    clearMessages();
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        title: formTitle.trim(),
        introduction: formIntro.trim() ? formIntro.trim() : null,
        visibility: formVisibility,
      };
      if (formVisibility === 'Shared') {
        body.accessUserIds = formAccessUsers.map((u) => u.id);
      }

      const res = await fetch(`/api/clusters/${currentCluster.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? 'שגיאה בעדכון');
        return;
      }
      const updated: Cluster = json.data;
      setClusters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setMode('idle');
      setInfo('המקבץ עודכן');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!currentCluster) return;
    if (otherClusters.length === 0) {
      setError('לא ניתן למחוק — אין מקבץ אחר להעביר אליו');
      return;
    }
    if (!deleteTargetId) {
      setError('יש לבחור מקבץ יעד');
      return;
    }
    clearMessages();
    setBusy(true);
    try {
      const url = `/api/clusters/${currentCluster.id}?targetClusterId=${encodeURIComponent(
        deleteTargetId,
      )}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה במחיקה');
        return;
      }
      const movedFromId = currentCluster.id;
      const targetId = deleteTargetId;
      setClusters((prev) =>
        prev
          .filter((c) => c.id !== movedFromId)
          .map((c) =>
            c.id === targetId
              ? {
                  ...c,
                  _count: {
                    responses: c._count.responses + currentCluster._count.responses,
                  },
                }
              : c,
          ),
      );
      setCurrentClusterId(targetId);
      onClusterChanged?.(targetId);
      setMode('idle');
      setInfo('המקבץ נמחק והחוות-דעת הועברו');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">מקבץ (Cluster)</h3>
        {mode === 'idle' && currentCluster && (
          <div className="flex gap-3 text-xs">
            <button
              type="button"
              onClick={openCreate}
              disabled={busy}
              className="text-blue-600 hover:underline disabled:opacity-50"
            >
              חדש
            </button>
            <button
              type="button"
              onClick={openEdit}
              disabled={busy}
              className="text-blue-600 hover:underline disabled:opacity-50"
            >
              ערוך
            </button>
            <button
              type="button"
              onClick={openDelete}
              disabled={busy || otherClusters.length === 0}
              title={otherClusters.length === 0 ? 'יש ליצור מקבץ נוסף לפני מחיקה' : ''}
              className="text-red-600 hover:underline disabled:opacity-40"
            >
              מחק
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">טוען מקבצים...</p>
      ) : (
        <>
          <label className="block text-xs text-gray-600">
            שיוך חוות הדעת למקבץ:
            <select
              className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm disabled:opacity-50"
              value={currentClusterId}
              onChange={(e) => handleAssignCurrent(e.target.value)}
              disabled={busy || mode !== 'idle'}
            >
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({VISIBILITY_LABELS[c.visibility] ?? c.visibility})
                </option>
              ))}
            </select>
          </label>

          {mode === 'create' && (
            <ClusterForm
              title={formTitle}
              intro={formIntro}
              visibility={formVisibility}
              accessUsers={formAccessUsers}
              onChangeTitle={setFormTitle}
              onChangeIntro={setFormIntro}
              onChangeVisibility={setFormVisibility}
              onChangeAccessUsers={setFormAccessUsers}
              onSubmit={handleCreate}
              onCancel={cancel}
              submitLabel={busy ? 'יוצר...' : 'צור'}
              disabled={busy || !formTitle.trim()}
            />
          )}

          {mode === 'edit' && currentCluster && (
            <ClusterForm
              title={formTitle}
              intro={formIntro}
              visibility={formVisibility}
              accessUsers={formAccessUsers}
              onChangeTitle={setFormTitle}
              onChangeIntro={setFormIntro}
              onChangeVisibility={setFormVisibility}
              onChangeAccessUsers={setFormAccessUsers}
              onSubmit={handleSaveEdit}
              onCancel={cancel}
              submitLabel={busy ? 'שומר...' : 'שמור'}
              disabled={busy || !formTitle.trim()}
            />
          )}

          {mode === 'delete' && currentCluster && (
            <div className="space-y-2 rounded-md border border-red-200 bg-white p-3">
              <p className="text-xs text-gray-700">
                מחיקת מקבץ <strong>{currentCluster.title}</strong> ({currentCluster._count.responses} חוות דעת).
                יש לבחור מקבץ יעד שאליו יועברו כל חוות הדעת:
              </p>
              <select
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                value={deleteTargetId}
                onChange={(e) => setDeleteTargetId(e.target.value)}
                disabled={busy}
              >
                {otherClusters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({VISIBILITY_LABELS[c.visibility] ?? c.visibility})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy || !deleteTargetId}
                  className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {busy ? 'מוחק...' : 'מחק והעבר'}
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  disabled={busy}
                  className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 disabled:opacity-50"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
          {info && <p className="text-xs text-green-700">{info}</p>}
        </>
      )}
    </div>
  );
}

interface FormProps {
  title: string;
  intro: string;
  visibility: string;
  accessUsers: AccessUser[];
  onChangeTitle: (v: string) => void;
  onChangeIntro: (v: string) => void;
  onChangeVisibility: (v: string) => void;
  onChangeAccessUsers: (users: AccessUser[]) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  disabled: boolean;
}

function ClusterForm({
  title,
  intro,
  visibility,
  accessUsers,
  onChangeTitle,
  onChangeIntro,
  onChangeVisibility,
  onChangeAccessUsers,
  onSubmit,
  onCancel,
  submitLabel,
  disabled,
}: FormProps) {
  return (
    <div className="space-y-2 rounded-md border border-gray-200 bg-white p-3">
      <input
        type="text"
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        placeholder="שם המקבץ..."
        value={title}
        onChange={(e) => onChangeTitle(e.target.value)}
      />
      <textarea
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        placeholder="תיאור (לא חובה)"
        rows={2}
        value={intro}
        onChange={(e) => onChangeIntro(e.target.value)}
      />
      <select
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        value={visibility}
        onChange={(e) => onChangeVisibility(e.target.value)}
      >
        <option value="Private">פרטי</option>
        <option value="Shared">משותף</option>
        <option value="Public">ציבורי</option>
      </select>

      {visibility === 'Shared' && (
        <SharedAccessPicker users={accessUsers} onChange={onChangeAccessUsers} />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

interface PickerProps {
  users: AccessUser[];
  onChange: (users: AccessUser[]) => void;
}

function SharedAccessPicker({ users, onChange }: PickerProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<AccessUser[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/users?search=${encodeURIComponent(term)}`)
        .then((res) => (res.ok ? res.json() : { data: [] }))
        .then((json) => {
          if (cancelled) return;
          const list = (json.data ?? []) as AccessUser[];
          setResults(list);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search]);

  function add(u: AccessUser) {
    if (users.some((x) => x.id === u.id)) return;
    onChange([...users, u]);
    setSearch('');
    setResults([]);
  }

  function remove(id: string) {
    onChange(users.filter((u) => u.id !== id));
  }

  const selectedIds = new Set(users.map((u) => u.id));
  const filteredResults = results.filter((r) => !selectedIds.has(r.id));

  return (
    <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-2">
      <p className="text-xs font-semibold text-gray-700">משתמשים משותפים:</p>

      {users.length === 0 ? (
        <p className="text-xs text-gray-500">אין משתמשים משותפים — חפש למטה כדי להוסיף.</p>
      ) : (
        <ul className="flex flex-wrap gap-1">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs"
            >
              <span>{u.name}</span>
              <button
                type="button"
                onClick={() => remove(u.id)}
                className="text-red-600 hover:text-red-800"
                aria-label={`הסר ${u.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <input
          type="text"
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          placeholder="חפש משתמש להוספה (לפחות 2 תווים)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search.trim().length >= 2 && (
          <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded border border-gray-300 bg-white shadow">
            {searching ? (
              <p className="px-2 py-1 text-xs text-gray-400">מחפש...</p>
            ) : filteredResults.length === 0 ? (
              <p className="px-2 py-1 text-xs text-gray-400">אין תוצאות</p>
            ) : (
              filteredResults.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => add(u)}
                  className="block w-full px-2 py-1 text-right text-xs hover:bg-gray-100"
                >
                  {u.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
