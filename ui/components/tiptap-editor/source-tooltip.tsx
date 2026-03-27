'use client';

import { useState } from 'react';
import { useSourceText } from '@/ui/hooks/use-source-text';

interface SourceTooltipProps {
  path: string;
  children: React.ReactNode;
}

export function SourceTooltip({ path, children }: SourceTooltipProps) {
  const [hovered, setHovered] = useState(false);
  const { text, loading } = useSourceText(path, hovered);

  return (
    <span
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <span
          className="absolute bottom-full right-0 z-50 mb-1 max-w-xs rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-lg"
          dir="rtl"
        >
          {loading ? (
            <span className="text-gray-400">טוען...</span>
          ) : text ? (
            <span className="text-gray-800 leading-relaxed">
              {text.slice(0, 300)}
              {text.length > 300 ? '…' : ''}
            </span>
          ) : (
            <span className="text-gray-400">לא נמצא מקור</span>
          )}
        </span>
      )}
    </span>
  );
}
