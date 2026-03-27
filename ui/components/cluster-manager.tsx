'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Cluster {
  id: string;
  title: string;
  introduction: string | null;
  visibility: string;
  _count: { responses: number };
}

export function ClusterManager() {
  const router = useRouter();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('Private');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/clusters')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setClusters(json.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!title.trim()) return;
    setError('');
    setCreating(true);
    try {
      const res = await fetch('/api/clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), visibility }),
      });
      if (res.ok) {
        const json = await res.json();
        setClusters((prev) => [json.data, ...prev]);
        setTitle('');
        setShowCreate(false);
        router.refresh();
      } else {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה ביצירה');
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(clusterId: string) {
    if (!confirm('למחוק את הקובץ?')) return;
    const res = await fetch(`/api/clusters/${clusterId}`, { method: 'DELETE' });
    if (res.ok) {
      setClusters((prev) => prev.filter((c) => c.id !== clusterId));
    }
  }

  const visibilityLabels: Record<string, string> = {
    Private: 'פרטי',
    Shared: 'משותף',
    Public: 'ציבורי',
  };

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">קבצי חוות דעת</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs text-blue-600 hover:underline"
        >
          {showCreate ? 'ביטול' : 'חדש'}
        </button>
      </div>

      {showCreate && (
        <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          <input
            type="text"
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            placeholder="שם הקובץ..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="Private">פרטי</option>
            <option value="Shared">משותף</option>
            <option value="Public">ציבורי</option>
          </select>
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim()}
            className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'יוצר...' : 'צור'}
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}

      {loading && <p className="text-xs text-gray-400">טוען...</p>}

      <div className="space-y-2">
        {clusters.map((cluster) => (
          <div
            key={cluster.id}
            className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-2"
          >
            <div>
              <p className="text-sm font-medium text-gray-700">{cluster.title}</p>
              <p className="text-xs text-gray-500">
                {visibilityLabels[cluster.visibility] ?? cluster.visibility} ·{' '}
                {cluster._count.responses} חוות דעת
              </p>
            </div>
            {cluster._count.responses === 0 && (
              <button
                onClick={() => handleDelete(cluster.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                מחק
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
