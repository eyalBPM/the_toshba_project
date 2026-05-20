'use client';

import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@/ui/components/confirm-dialog';

interface Entity {
  id: string;
  text: string;
}

interface MergeResult {
  victimText: string;
  winnerText: string;
  affectedSnapshots: number;
  affectedRevisions: number;
}

interface EntityMergePanelProps {
  kind: 'topic' | 'sage';
  /** API endpoint for listing entities — must support `?search=` and return `{ data: Entity[] }`. */
  listEndpoint: string;
  /** API endpoint for performing the merge. POST `{ victimId, winnerId }`. */
  mergeEndpoint: string;
  labels: {
    /** Page title shown above the panel (e.g. "ניהול נושאים"). */
    heading: string;
    /** Singular noun in the dialog (e.g. "נושא"). */
    singular: string;
    /** Plural noun used in empty state etc. (e.g. "נושאים"). */
    plural: string;
  };
}

async function fetchEntities(endpoint: string, search: string): Promise<Entity[]> {
  const url = search.trim()
    ? `${endpoint}?search=${encodeURIComponent(search.trim())}`
    : endpoint;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: Entity[] };
  return Array.isArray(json.data) ? json.data : [];
}

export function EntityMergePanel({
  kind: _kind,
  listEndpoint,
  mergeEndpoint,
  labels,
}: EntityMergePanelProps) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [victim, setVictim] = useState<Entity | null>(null);
  const [winnerSearch, setWinnerSearch] = useState('');
  const [winnerOptions, setWinnerOptions] = useState<Entity[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<Entity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState<MergeResult | null>(null);

  const refresh = async (q: string) => {
    setLoading(true);
    try {
      const data = await fetchEntities(listEndpoint, q);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => refresh(search), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (!victim) return;
    const t = setTimeout(async () => {
      const data = await fetchEntities(listEndpoint, winnerSearch);
      setWinnerOptions(data.filter((e) => e.id !== victim.id));
    }, 200);
    return () => clearTimeout(t);
  }, [victim, winnerSearch, listEndpoint]);

  function openMerge(item: Entity) {
    setVictim(item);
    setWinnerSearch('');
    setWinnerOptions([]);
    setSelectedWinner(null);
    setError('');
  }

  function closeMerge() {
    setVictim(null);
    setSelectedWinner(null);
    setError('');
  }

  async function submitMerge() {
    if (!victim || !selectedWinner) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(mergeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ victimId: victim.id, winnerId: selectedWinner.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error?.message ?? 'שגיאה במיזוג');
        return;
      }
      setLastResult({
        victimText: victim.text,
        winnerText: selectedWinner.text,
        affectedSnapshots: json.data?.affectedSnapshots ?? 0,
        affectedRevisions: json.data?.affectedRevisions ?? 0,
      });
      closeMerge();
      await refresh(search);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{labels.heading}</h1>

      {lastResult && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          מוזג בהצלחה: &quot;{lastResult.victimText}&quot; → &quot;{lastResult.winnerText}&quot;.
          עודכנו {lastResult.affectedSnapshots} snapshots ו-{lastResult.affectedRevisions} גרסאות.
          <button
            type="button"
            onClick={() => setLastResult(null)}
            className="mr-3 underline"
          >
            סגור
          </button>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`חיפוש ${labels.plural}...`}
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-gray-600">טקסט</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                  טוען...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                  לא נמצאו {labels.plural}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.text}</td>
                  <td className="px-4 py-3 text-left">
                    <button
                      type="button"
                      onClick={() => openMerge(item)}
                      className="rounded bg-orange-100 px-3 py-1 text-xs text-orange-700 hover:bg-orange-200"
                    >
                      מזג
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(victim)}
        onClose={() => {
          if (!submitting) closeMerge();
        }}
        title={`מיזוג ${labels.singular}: "${victim?.text ?? ''}"`}
        actions={[
          {
            label: 'ביטול',
            onClick: closeMerge,
            variant: 'secondary',
            disabled: submitting,
          },
          {
            label: submitting
              ? 'ממזג...'
              : selectedWinner
                ? `מזג אל "${selectedWinner.text}"`
                : 'בחר שורד',
            onClick: submitMerge,
            variant: 'danger',
            disabled: !selectedWinner || submitting,
          },
        ]}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            בחר את ה{labels.singular} ש&quot;ישרוד&quot;. כל ה-snapshots וכל הופעות
            ה{labels.singular} בגוף הגרסאות יעודכנו, וה{labels.singular} הנוכחי יימחק.{' '}
            <strong>פעולה זו אינה הפיכה.</strong>
          </p>

          <input
            type="text"
            value={winnerSearch}
            onChange={(e) => {
              setWinnerSearch(e.target.value);
              setSelectedWinner(null);
            }}
            placeholder={`חפש ${labels.singular} שורד...`}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            autoFocus
          />

          <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200">
            {winnerOptions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-500">
                {winnerSearch.trim() ? 'אין תוצאות' : `הקלד לחיפוש ${labels.plural}`}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {winnerOptions.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedWinner(opt)}
                      className={`block w-full px-3 py-2 text-right text-sm hover:bg-blue-50 ${
                        selectedWinner?.id === opt.id ? 'bg-blue-100 font-medium' : ''
                      }`}
                    >
                      {opt.text}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </ConfirmDialog>
    </div>
  );
}
