'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInfiniteList } from '@/ui/hooks/use-infinite-list';
import { InfiniteScrollTrigger } from './infinite-scroll-trigger';

interface Article {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  snapshot: {
    topicsSnapshot: unknown;
    sagesSnapshot: unknown;
  } | null;
}

export function ArticlesTable() {
  const [search, setSearch] = useState('');

  const { items, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteList<Article>({
      url: '/api/articles',
      queryKey: ['articles'],
      params: {
        limit: '20',
        ...(search ? { search } : {}),
      },
    });

  return (
    <div dir="rtl">
      <div className="mb-4">
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="חיפוש ערכים..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">טוען...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">לא נמצאו ערכים.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-600">כותרת</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">נושאים</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">חכמים</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((article) => {
                const topics = Array.isArray(article.snapshot?.topicsSnapshot)
                  ? (article.snapshot.topicsSnapshot as Array<{ text: string }>)
                  : [];
                const sages = Array.isArray(article.snapshot?.sagesSnapshot)
                  ? (article.snapshot.sagesSnapshot as Array<{ text: string }>)
                  : [];

                return (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {article.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {topics.map((t) => t.text).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {sages.map((s) => s.text).join(', ') || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InfiniteScrollTrigger
        onTrigger={() => fetchNextPage()}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}
