'use client';

import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  anchorClassName?: string;
  children: React.ReactNode;
}

/**
 * Lightweight popover wrapper used by the column-header filters. Closes on
 * outside click or Escape. Positioned relative to its parent — the column
 * header sets `position: relative` and we anchor below.
 */
export function FilterPopoverShell({ open, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute z-30 mt-1 w-72 rounded-md border border-gray-200 bg-white p-3 shadow-lg"
      dir="rtl"
    >
      {children}
    </div>
  );
}
