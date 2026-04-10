'use client';

import Link from 'next/link';

interface MinorChangeRequestFormProps {
  editUrl: string;
  pendingMcrId?: string;
}

export function MinorChangeRequestForm({ editUrl, pendingMcrId }: MinorChangeRequestFormProps) {
  const separator = editUrl.includes('?') ? '&' : '?';
  const mcrIdParam = pendingMcrId ? `&mcrId=${pendingMcrId}` : '';
  const mcrUrl = `${editUrl}${separator}mode=mcr${mcrIdParam}`;

  return (
    <Link
      href={mcrUrl}
      className="inline-block rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-200"
    >
      {pendingMcrId ? 'ערוך בקשה לשינוי מינורי' : 'בקשת שינוי מינורי'}
    </Link>
  );
}
