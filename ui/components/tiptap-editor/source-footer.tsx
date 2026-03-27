'use client';

import { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { getCitationList } from '@/ui/extensions/source-citation';
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
      const citations = getCitationList(editor.state.doc);
      // Deduplicate by sourceId for footer display, keeping first occurrence number
      const seen = new Set<string>();
      const result: FooterEntry[] = [];
      citations.forEach((c, idx) => {
        const key = c.sourceId === 'missing' ? `missing-${idx}` : c.sourceId;
        if (seen.has(key)) return;
        seen.add(key);
        if (c.sourceId === 'missing') {
          result.push({ number: idx + 1, sourceId: 'missing', label: c.missingText ?? '' });
        } else {
          const src = sources.find((s) => s.id === c.sourceId);
          result.push({
            number: idx + 1,
            sourceId: c.sourceId,
            label: src?.label ?? c.sourceId,
            path: src?.path,
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
