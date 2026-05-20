'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatHebrewDate } from '@/lib/hebrew-dates';
import { ContentRenderer } from '@/ui/components/content-renderer';

interface OpinionResponseItem {
  id: string;
  clusterId: string;
  userId: string;
  content: unknown;
  createdAt: string;
  updatedAt: string;
  savedAtRevisionId: string;
  published: boolean;
  user: { id: string; name: string };
  cluster: { id: string; title: string; visibility: string; ownerUserId: string };
}

interface OpinionListProps {
  slug: string;
  currentUserId: string | null;
  isVerified: boolean;
  articleId: string;
  articleCurrentRevisionId: string | null;
}

type ClusterSelection = 'all' | Set<string>;

export function OpinionList({
  slug,
  currentUserId,
  isVerified,
  articleId,
  articleCurrentRevisionId,
}: OpinionListProps) {
  const router = useRouter();
  const [responses, setResponses] = useState<OpinionResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedClusters, setSelectedClusters] = useState<ClusterSelection>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/articles/${slug}/opinions`)
      .then((res) => (res.ok ? res.json() : { data: { items: [] } }))
      .then((json) => setResponses(json.data?.items ?? []))
      .finally(() => setLoading(false));
  }, [slug]);

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return;
    function onClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [filterOpen]);

  async function handleCreate() {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/opinions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      const text = await res.text();
      let json: unknown = null;
      try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
      const j = json as { data?: { responseId?: string }; error?: { code?: string; message?: string } } | null;
      if (res.ok && j?.data?.responseId) {
        router.push(`/articles/${slug}/opinion/${j.data.responseId}/edit`);
        return;
      }
      const serverMsg = j?.error?.message ?? text ?? '(empty body)';
      const code = j?.error?.code ?? 'NO_CODE';
      console.error(
        `[OpinionList] create failed status=${res.status} code=${code} sentArticleId=${articleId} body=${text}`,
      );
      setCreateError(`HTTP ${res.status} ${code}: ${serverMsg}`);
    } catch (err) {
      console.error('[OpinionList] create threw', err);
      setCreateError('שגיאת רשת ביצירת תגובת דעה');
    } finally {
      setCreating(false);
    }
  }

  // Defensive client-side visibility filter — server already enforces this,
  // but we re-check in case the server contract regresses. Shared clusters
  // require an access list the client doesn't have, so we trust the server
  // for those (it would not have returned the row if access were missing).
  const visibleResponses = useMemo(
    () =>
      responses.filter((r) => {
        if (!r.published && currentUserId !== r.userId) return false;
        if (r.cluster.visibility === 'Public') return true;
        if (currentUserId && r.cluster.ownerUserId === currentUserId) return true;
        if (r.cluster.visibility === 'Shared') return true;
        return false;
      }),
    [responses, currentUserId],
  );

  // Unique clusters present in the visible responses, sorted by title.
  const availableClusters = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of visibleResponses) {
      if (!map.has(r.cluster.id)) map.set(r.cluster.id, r.cluster.title);
    }
    return Array.from(map, ([id, title]) => ({ id, title })).sort((a, b) =>
      a.title.localeCompare(b.title, 'he'),
    );
  }, [visibleResponses]);

  function isClusterSelected(id: string): boolean {
    return selectedClusters === 'all' || selectedClusters.has(id);
  }

  function toggleCluster(id: string) {
    setSelectedClusters((prev) => {
      if (prev === 'all') {
        // Switch to explicit set: all available minus the one being unchecked.
        const next = new Set(availableClusters.map((c) => c.id));
        next.delete(id);
        return next;
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllClusters() {
    setSelectedClusters('all');
  }

  function clearAllClusters() {
    setSelectedClusters(new Set());
  }

  const filteredResponses = useMemo(
    () => visibleResponses.filter((r) => isClusterSelected(r.cluster.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleResponses, selectedClusters],
  );

  const selectedCountLabel = (() => {
    if (selectedClusters === 'all') return 'הכל';
    if (selectedClusters.size === 0) return 'אין';
    if (selectedClusters.size === availableClusters.length) return 'הכל';
    return `${selectedClusters.size}/${availableClusters.length}`;
  })();

  if (collapsed) {
    return (
      <aside className="shrink-0" dir="rtl">
        <button
          onClick={() => setCollapsed(false)}
          className="text-xs text-gray-500 hover:text-gray-700"
          title="הצג תגובות דעה"
        >
          הצג
        </button>
      </aside>
    );
  }

  return (
    <aside className="min-w-0 flex-1 space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">תגובות דעה</h3>
        <button
          onClick={() => setCollapsed(true)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          הסתר
        </button>
      </div>

      {/* Cluster multi-select filter */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              disabled={availableClusters.length === 0}
              className="flex w-full items-center justify-between rounded border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="text-gray-700">
                סינון לפי מקבץ: <span className="font-medium">{selectedCountLabel}</span>
              </span>
              <span className="text-gray-400">▾</span>
            </button>
            {filterOpen && availableClusters.length > 0 && (
              <div className="absolute right-0 z-10 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-100 px-2 py-1">
                  <button
                    type="button"
                    onClick={selectAllClusters}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    בחר הכל
                  </button>
                  <button
                    type="button"
                    onClick={clearAllClusters}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    נקה הכל
                  </button>
                </div>
                <ul className="max-h-60 overflow-y-auto py-1">
                  {availableClusters.map((c) => (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-center gap-2 px-2 py-1 text-sm hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={isClusterSelected(c.id)}
                          onChange={() => toggleCluster(c.id)}
                        />
                        <span className="flex-1 truncate">{c.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {isVerified && (
            <>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'יוצר...' : 'כתוב תגובת דעה'}
              </button>
              {createError && (
                <p className="text-xs text-red-600">{createError}</p>
              )}
            </>
          )}

          <div className="max-h-[80vh] space-y-4 overflow-y-auto pl-1">
            {loading && <p className="text-xs text-gray-400">טוען...</p>}

            {!loading && filteredResponses.length === 0 && (
              <p className="text-xs text-gray-400">
                {visibleResponses.length === 0
                  ? 'אין תגובות דעה עדיין'
                  : 'אין תגובות דעה התואמות לסינון'}
              </p>
            )}

            {filteredResponses.map((resp) => {
              const isStale =
                articleCurrentRevisionId !== null &&
                resp.savedAtRevisionId !== articleCurrentRevisionId;
              const isAuthor = currentUserId === resp.userId;
              const isOwnedDraft = !resp.published && isAuthor;
              return (
                <article
                  key={resp.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <header className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">
                          {resp.user.name}
                        </span>
                        <span>·</span>
                        <span className="truncate">{resp.cluster.title}</span>
                        <span>·</span>
                        <span>{formatHebrewDate(resp.createdAt)}</span>
                      </div>
                      {isOwnedDraft && (
                        <span className="mt-1 inline-block rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-800">
                          טיוטה — לא פורסם
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/articles/${slug}/opinion/${resp.id}`}
                      className="shrink-0 text-xs text-blue-600 hover:underline"
                    >
                      פתח
                    </Link>
                  </header>

                  <ContentRenderer
                    content={resp.content}
                    isOwner={isAuthor}
                    imageStatuses={{}}
                  />

                  {isStale && (
                    <p className="mt-2 text-[11px] text-gray-400">
                      נכתב עבור{' '}
                      <Link
                        href={`/revisions/${resp.savedAtRevisionId}`}
                        className="underline hover:text-gray-600"
                      >
                        מהדורה ישנה
                      </Link>
                    </p>
                  )}
                </article>
              );
            })}
      </div>
    </aside>
  );
}
