'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/domain/types';

interface ChangeRoleButtonProps {
  userId: string;
  userName: string;
  currentRole: UserRole;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'User', label: 'משתמש רגיל' },
  { value: 'Moderator', label: 'מנהל תוכן' },
  { value: 'Senior', label: 'בכיר' },
  { value: 'Admin', label: 'מנהל מערכת' },
];

export function ChangeRoleButton({ userId, userName, currentRole }: ChangeRoleButtonProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (selectedRole === currentRole) return;
    const option = ROLE_OPTIONS.find((o) => o.value === selectedRole);
    if (!confirm(`לשנות את תפקידו של ${userName} ל"${option?.label}"?`)) return;
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה');
        setSelectedRole(currentRole);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
        disabled={saving}
        className="rounded border border-gray-300 px-2 py-1 text-xs"
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={saving || selectedRole === currentRole}
        className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700 hover:bg-purple-200 disabled:opacity-50"
      >
        {saving ? 'שומר...' : 'עדכן'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
