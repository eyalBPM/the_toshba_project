'use client';

import { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { getCitationNumbers } from '@/ui/extensions/source-citation';
import { SourceTooltip } from './source-tooltip';
import type { DbSourceItem } from '@/ui/hooks/use-sources';

interface FooterEntry {
  number: number;
  sourceId: string;
  label: string;
  path?: string;
}

interface SourceFooterProps {
  editor: Editor | null;
  sources: DbSourceItem[];
}

export function SourceFooter({ editor, sources }: SourceFooterProps) {
  const [entries, setEntries] = useState<FooterEntry[]>([]);

  useEffect(() => {
    if (!editor) return;

    function recompute() {
      if (!editor) return;
      const { citations, numbers } = getCitationNumbers(editor.state.doc);
      // One footer entry per unique citation number (matches the inline [n] badges).
      const seen = new Set<number>();
      const result: FooterEntry[] = [];
      citations.forEach((c, idx) => {
        const n = numbers[idx];
        if (seen.has(n)) return;
        seen.add(n);
        if (c.sourceId === 'missing') {
          result.push({ number: n, sourceId: 'missing', label: c.missingText ?? '' });
        } else {
          const src = sources.find((s) => s.id === c.sourceId);
          if (!src) return;
          result.push({
            number: n,
            sourceId: c.sourceId,
            label: src.label,
            path: src.path,
          });
        }
      });
      setEntries(result);
    }

    recompute();
    editor.on('transaction', recompute);
    return () => {
      editor.off('transaction', recompute);
    };
  }, [editor, sources]);

  if (entries.length === 0) return null;

  return (
    <div className="mt-4 border-t border-gray-200 pt-3 text-sm text-gray-600" dir="rtl">
      <ol className="space-y-1">
        {entries.map((entry) => (
          <li key={`${entry.sourceId}-${entry.number}`} className="flex gap-2">
            <span className="shrink-0 text-xs font-medium text-amber-700">[{entry.number}]</span>
            {entry.path ? (
              <SourceTooltip path={entry.path}>
                <span className="cursor-help underline decoration-dotted">{entry.label}</span>
              </SourceTooltip>
            ) : (
              <span>{entry.label}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
