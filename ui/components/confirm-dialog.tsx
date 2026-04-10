'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface DialogAction {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'danger' | 'secondary' | 'warning';
  disabled?: boolean;
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions: DialogAction[];
}

const variantClasses: Record<DialogAction['variant'], string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50',
  warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-50',
};

export function ConfirmDialog({ open, onClose, title, children, actions }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      document.addEventListener('keydown', handleKeyDown);
      // Focus first button after mount
      requestAnimationFrame(() => {
        const firstButton = dialogRef.current?.querySelector<HTMLElement>('button');
        firstButton?.focus();
      });
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else if (previousFocusRef.current instanceof HTMLElement) {
      previousFocusRef.current.focus();
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className="relative z-10 mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        dir="rtl"
      >
        <h2 id="dialog-title" className="mb-3 text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <div className="mb-6 text-sm text-gray-600">{children}</div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`rounded-md px-4 py-2 text-sm font-medium ${variantClasses[action.variant]}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
