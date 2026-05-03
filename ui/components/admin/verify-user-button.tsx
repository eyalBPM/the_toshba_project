'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VerifyUserButtonProps {
  userId: string;
  userName: string;
}

export function VerifyUserButton({ userId, userName }: VerifyUserButtonProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleVerify() {
    if (!confirm(`לאמת את ${userName}?`)) return;
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, { method: 'POST' });
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
        onClick={handleVerify}
        disabled={saving}
        className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
      >
        {saving ? 'מאמת...' : 'אמת משתמש'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
