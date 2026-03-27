'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GrantSeniorButtonProps {
  userId: string;
  userName: string;
}

export function GrantSeniorButton({ userId, userName }: GrantSeniorButtonProps) {
  const router = useRouter();
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState('');

  async function handleGrant() {
    if (!confirm(`להעניק הרשאת בכיר ל${userName}?`)) return;
    setError('');
    setGranting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/grant-senior`, {
        method: 'POST',
      });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה');
      }
    } finally {
      setGranting(false);
    }
  }

  return (
    <>
      <button
        onClick={handleGrant}
        disabled={granting}
        className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700 hover:bg-purple-200 disabled:opacity-50"
      >
        {granting ? 'מעניק...' : 'הענק בכיר'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </>
  );
}
