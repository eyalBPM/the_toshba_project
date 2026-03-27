'use client';

import { useState } from 'react';

export function ResetCacheButton() {
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleReset() {
    setResetting(true);
    setDone(false);
    try {
      const res = await fetch('/api/admin/cache/reset-sources', { method: 'POST' });
      if (res.ok) {
        setDone(true);
        setTimeout(() => setDone(false), 3000);
      }
    } finally {
      setResetting(false);
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={resetting}
      className="rounded bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300 disabled:opacity-50"
    >
      {resetting ? 'מאפס...' : done ? '✓ אופס' : 'אפס מטמון מקורות'}
    </button>
  );
}
