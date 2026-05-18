'use client';

import { useEffect, useRef, useState } from 'react';
import { useSourceText } from '@/ui/hooks/use-source-text';

interface SourceTooltipProps {
  path: string;
  children: React.ReactNode;
}

const TRUNCATE_LENGTH = 300;
const FADE_MS = 500;
const HIDE_DELAY_MS = FADE_MS + 50;

export function SourceTooltip({ path, children }: SourceTooltipProps) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { text, loading } = useSourceText(path, visible);

  useEffect(
    () => () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    },
    [],
  );

  function show() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setVisible(true);
    setHovered(true);
  }

  function scheduleHide() {
    setHovered(false);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setExpanded(false);
      hideTimeoutRef.current = null;
    }, HIDE_DELAY_MS);
  }

  const isLong = !!text && text.length > TRUNCATE_LENGTH;
  const displayedText = text && !expanded && isLong ? `${text.slice(0, TRUNCATE_LENGTH)}…` : text;

  return (
    <span className="relative" onMouseEnter={show} onMouseLeave={scheduleHide}>
      {children}
      {visible && (
        <span
          className={`absolute bottom-full right-0 z-50 mb-1 rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-lg ${
            expanded ? 'max-w-md' : 'max-w-xs'
          }`}
          style={{
            opacity: hovered ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
          dir="rtl"
          onMouseEnter={show}
          onMouseLeave={scheduleHide}
        >
          {loading ? (
            <span className="text-gray-400">טוען...</span>
          ) : text ? (
            <>
              <span
                className={`block text-gray-800 leading-relaxed ${
                  expanded ? 'max-h-64 overflow-y-auto' : ''
                }`}
              >
                {displayedText}
              </span>
              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2 block w-full border-t border-gray-100 pt-1 text-center text-[11px] text-amber-700 hover:text-amber-900"
                >
                  {expanded ? 'הצג פחות' : 'הצג את כל המקור'}
                </button>
              )}
            </>
          ) : (
            <span className="text-gray-400">לא נמצא מקור</span>
          )}
        </span>
      )}
    </span>
  );
}
