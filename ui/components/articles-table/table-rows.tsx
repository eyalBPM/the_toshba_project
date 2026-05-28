'use client';

import Link from 'next/link';
import type { ArticleRow } from './table-types';

interface Props {
  articles: ArticleRow[];
}

interface SourceItem {
  label?: string;
}
interface TagItem {
  text?: string;
}

function joinSnapshot(arr: unknown, getter: (item: unknown) => string | undefined): string {
  if (!Array.isArray(arr)) return '—';
  const texts = arr
    .map(getter)
    .filter((s): s is string => typeof s === 'string' && s.length > 0);
  return texts.length === 0 ? '—' : texts.join(', ');
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function ArticlesTableRows({ articles }: Props) {
  return (
    <tbody className="divide-y divide-gray-100">
      {articles.map((article) => {
        const sourcesText = joinSnapshot(
          article.snapshot?.sourcesSnapshot,
          (s) => (s as SourceItem | undefined)?.label,
        );
        const topicsText = joinSnapshot(
          article.snapshot?.topicsSnapshot,
          (t) => (t as TagItem | undefined)?.text,
        );
        const sagesText = joinSnapshot(
          article.snapshot?.sagesSnapshot,
          (s) => (s as TagItem | undefined)?.text,
        );

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
            <td className="px-4 py-3 text-xs text-gray-600">{sourcesText}</td>
            <td className="px-4 py-3 text-xs text-gray-600">{topicsText}</td>
            <td className="px-4 py-3 text-xs text-gray-600">{sagesText}</td>
            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
              {formatRelativeDate(article.updatedAt)}
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
