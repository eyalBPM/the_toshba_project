'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProposeRevisionButton({
  articleId,
  slug,
}: {
  articleId: string;
  slug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'הצעת עדכון', articleId }),
      });
      if (res.ok) {
        const json = await res.json();
        router.push(`/articles/${slug}/propose/${json.data.revisionId}/edit`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
    >
      {loading ? 'יוצר...' : 'הצע עדכון'}
    </button>
  );
}
