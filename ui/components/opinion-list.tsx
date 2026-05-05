'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OpinionResponseItem {
  id: string;
  clusterId: string;
  userId: string;
  content: unknown;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
  cluster: { id: string; title: string; visibility: string; ownerUserId: string };
}

interface OpinionListProps {
  slug: string;
  currentUserId: string | null;
  isVerified: boolean;
  articleId: string;
}

export function OpinionList({
  slug,
  currentUserId,
  isVerified,
  articleId,
}: OpinionListProps) {
  const router = useRouter();
  const [responses, setResponses] = useState<OpinionResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`/api/articles/${slug}/opinions`)
      .then((res) => (res.ok ? res.json() : { data: { items: [] } }))
      .then((json) => setResponses(json.data?.items ?? []))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch('/api/opinions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      if (res.ok) {
        const json = await res.json();
        router.push(`/articles/${slug}/opinion/${json.data.responseId}/edit`);
      }
    } finally {
      setCreating(false);
    }
  }

  // Defensive client-side visibility filter — server already enforces this,
  // but we re-check in case the server contract regresses. Shared clusters
  // require an access list the client doesn't have, so we trust the server
  // for those (it would not have returned the row if access were missing).
  const visibleResponses = responses.filter((r) => {
    if (r.cluster.visibility === 'Public') return true;
    if (currentUserId && r.cluster.ownerUserId === currentUserId) return true;
    if (r.cluster.visibility === 'Shared') return true;
    return false;
  });

  // Group responses by cluster
  const grouped = visibleResponses.reduce<Record<string, { title: string; items: OpinionResponseItem[] }>>(
    (acc, resp) => {
      if (!acc[resp.cluster.id]) {
        acc[resp.cluster.id] = { title: resp.cluster.title, items: [] };
      }
      acc[resp.cluster.id].items.push(resp);
      return acc;
    },
    {},
  );

  // Filter by search
  type GroupedCluster = { title: string; items: OpinionResponseItem[] };
  const filteredGroups: Record<string, GroupedCluster> = search.trim()
    ? Object.fromEntries(
        Object.entries(grouped)
          .map(([id, group]): [string, GroupedCluster] => [
            id,
            {
              ...group,
              items: group.items.filter(
                (r) =>
                  r.user.name.includes(search) ||
                  group.title.includes(search),
              ),
            },
          ])
          .filter(([, group]) => (group as GroupedCluster).items.length > 0),
      )
    : grouped;

  function getContentPreview(content: unknown): string {
    if (!content || typeof content !== 'object') return '';
    const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
    const firstParagraph = doc.content?.find((n) => n.content);
    const text = firstParagraph?.content?.map((c) => c.text ?? '').join('') ?? '';
    return text.length > 80 ? text.slice(0, 80) + '...' : text;
  }

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">חוות דעת</h3>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {collapsed ? 'הצג' : 'הסתר'}
        </button>
      </div>

      {!collapsed && (
        <>
          <input
            type="text"
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            placeholder="חיפוש..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {isVerified && (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'יוצר...' : 'כתוב חוות דעת'}
            </button>
          )}

          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {loading && <p className="text-xs text-gray-400">טוען...</p>}

            {!loading && Object.keys(filteredGroups).length === 0 && (
              <p className="text-xs text-gray-400">אין חוות דעת עדיין</p>
            )}

            {Object.entries(filteredGroups).map(([clusterId, group]: [string, GroupedCluster]) => (
              <div key={clusterId} className="space-y-1">
                <p className="text-xs font-medium text-gray-500">{group.title}</p>
                {group.items.map((resp) => (
                  <Link
                    key={resp.id}
                    href={`/articles/${slug}/opinion/${resp.id}`}
                    className="block rounded-md border border-gray-200 bg-white p-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{resp.user.name}</span>
                      <span>{new Date(resp.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 line-clamp-2">
                      {getContentPreview(resp.content) || 'חוות דעת ריקה'}
                    </p>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
