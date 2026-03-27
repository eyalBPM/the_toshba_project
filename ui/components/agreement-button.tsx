'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AgreementUser {
  id: string;
  name: string;
}

interface AgreementButtonProps {
  revisionId: string;
  currentUserId: string | null;
  isOwner: boolean;
  revisionStatus: string;
}

export function AgreementButton({
  revisionId,
  currentUserId,
  isOwner,
  revisionStatus,
}: AgreementButtonProps) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [agreers, setAgreers] = useState<AgreementUser[]>([]);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agreeing, setAgreeing] = useState(false);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    fetch(`/api/revisions/${revisionId}/agreements`)
      .then((res) => res.json())
      .then((json) => {
        const data = json.data ?? {};
        setCount(data.count ?? 0);
        setAgreers((data.agreements ?? []).map((a: { user: AgreementUser }) => a.user));
        if (currentUserId) {
          setHasAgreed(
            (data.agreements ?? []).some(
              (a: { userId: string }) => a.userId === currentUserId,
            ),
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [revisionId, currentUserId]);

  const canAgree =
    currentUserId &&
    !isOwner &&
    !hasAgreed &&
    revisionStatus === 'Pending';

  async function handleAgree() {
    setAgreeing(true);
    try {
      const res = await fetch(`/api/revisions/${revisionId}/agree`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        const result = json.data;
        setCount(result.agreementCount);
        setHasAgreed(true);
        if (result.approved) {
          router.refresh();
        } else {
          // Re-fetch to update agreers list
          const listRes = await fetch(`/api/revisions/${revisionId}/agreements`);
          if (listRes.ok) {
            const listJson = await listRes.json();
            setAgreers((listJson.data?.agreements ?? []).map((a: { user: AgreementUser }) => a.user));
          }
        }
      }
    } finally {
      setAgreeing(false);
    }
  }

  if (loading) {
    return <span className="text-sm text-gray-400">טוען...</span>;
  }

  return (
    <div className="space-y-2" dir="rtl">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
          {count} הסכמות
        </span>

        {canAgree && (
          <button
            onClick={handleAgree}
            disabled={agreeing}
            className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {agreeing ? 'שולח...' : 'הסכמה'}
          </button>
        )}

        {hasAgreed && (
          <span className="text-sm text-green-600">הסכמת לגרסה זו ✓</span>
        )}

        {isOwner && revisionStatus === 'Pending' && (
          <span className="text-xs text-gray-400">לא ניתן להסכים לגרסה משלך</span>
        )}
      </div>

      {agreers.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowList(!showList)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showList ? 'הסתר רשימה' : 'הצג מסכימים'}
          </button>
          {showList && (
            <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
              {agreers.map((u) => (
                <li key={u.id}>{u.name}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
