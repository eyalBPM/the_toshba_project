'use client';

import { useEffect, useState } from 'react';

interface MinorChangeRequest {
  id: string;
  status: string;
  message: string;
}

interface MinorChangeStatusProps {
  revisionId: string;
}

export function MinorChangeStatus({ revisionId }: MinorChangeStatusProps) {
  const [requests, setRequests] = useState<MinorChangeRequest[]>([]);

  useEffect(() => {
    fetch(`/api/revisions/${revisionId}/minor-change`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setRequests(json.data ?? []));
  }, [revisionId]);

  const pending = requests.find((r) => r.status === 'Pending');

  if (pending) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" dir="rtl">
        בקשת שינוי מינורי ממתינה לאישור
      </div>
    );
  }

  return null;
}
