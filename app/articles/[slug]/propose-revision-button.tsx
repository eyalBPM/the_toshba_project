'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
  articleId: string;
  slug: string;
  existingActiveRevisionId: string | null;
}

export function ProposeRevisionButton({
  articleId,
  slug,
  existingActiveRevisionId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (existingActiveRevisionId) {
    return (
      <Link
        href={`/articles/${slug}/propose/${existingActiveRevisionId}`}
        className="text-sm text-blue-600 hover:underline"
      >
        צפייה בהצעה הקיימת שלך
      </Link>
    );
  }

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      const json = await res.json();
      if (res.ok) {
        router.push(`/articles/${slug}/propose/${json.data.revisionId}/edit`);
        return;
      }
      if (res.status === 409 && json?.error?.code === 'ACTIVE_REVISION_ALREADY_EXISTS') {
        const existingId = json.error.details?.existingRevisionId as string | undefined;
        if (existingId) {
          router.push(`/articles/${slug}/propose/${existingId}`);
          return;
        }
      }
      setError(json?.error?.message ?? 'שגיאה ביצירת ההצעה');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
      >
        {loading ? 'יוצר...' : 'הצע עדכון'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </>
  );
}
