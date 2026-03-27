'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NewRevisionButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'ערך חדש ללא שם' }),
      });
      if (res.ok) {
        const json = await res.json();
        router.push(`/revisions/${json.data.revisionId}/edit`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'יוצר...' : 'הצע ערך חדש'}
    </button>
  );
}
