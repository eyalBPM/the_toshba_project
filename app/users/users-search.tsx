'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  initialSearch: string;
  initialStatus: string;
  initialRole: string;
}

export function UsersSearch({ initialSearch, initialStatus, initialRole }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [role, setRole] = useState(initialRole);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    if (role) params.set('role', role);
    const qs = params.toString();
    router.push(qs ? `/users?${qs}` : '/users');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 sm:flex-row"
    >
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="חפש לפי שם או אימייל..."
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">כל הסטטוסים</option>
        <option value="VerifiedUser">מאומת</option>
        <option value="PendingVerification">ממתין לאימות</option>
      </select>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">כל התפקידים</option>
        <option value="Admin">מנהל</option>
        <option value="Senior">בכיר</option>
        <option value="Moderator">מנחה</option>
        <option value="User">משתמש</option>
      </select>
      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        חפש
      </button>
    </form>
  );
}
