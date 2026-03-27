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
  const approved = requests.find((r) => r.status === 'Approved');

  if (approved) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" dir="rtl">
        שינוי מינורי אושר — ניתן לערוך ללא איפוס ההסכמות
      </div>
    );
  }

  if (pending) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" dir="rtl">
        בקשת שינוי מינורי ממתינה לאישור
      </div>
    );
  }

  return null;
}
