'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RevokeVerificationButtonProps {
  userId: string;
  userName: string;
}

export function RevokeVerificationButton({ userId, userName }: RevokeVerificationButtonProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleRevoke() {
    if (!confirm(`לבטל את אימותו של ${userName}?`)) return;
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRevoke}
        disabled={saving}
        className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700 hover:bg-amber-200 disabled:opacity-50"
      >
        {saving ? 'מבטל...' : 'בטל אימות'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
