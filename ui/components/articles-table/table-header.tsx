'use client';

import { useState } from 'react';
import type {
  ArticlesViewConfig,
  SortCol,
  TagRef,
} from '@/domain/articles-list/view-config';
import { BookFilterPopover } from './book-filter';
import { TagFilterPopover } from './tag-filter';

interface Props {
  config: ArticlesViewConfig;
  onChange: (next: ArticlesViewConfig) => void;
}

function SortIndicator({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <span className="text-gray-300">↕</span>;
  return <span className="text-gray-700">{dir === 'asc' ? '▲' : '▼'}</span>;
}

function FilterBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="rounded-full bg-blue-100 px-1.5 text-[10px] font-semibold leading-4 text-blue-700">
      {count}
    </span>
  );
}

export function ArticlesTableHeader({ config, onChange }: Props) {
  const [open, setOpen] = useState<null | 'books' | 'topics' | 'sages'>(null);

  function toggleSort(col: SortCol, defaultDir: 'asc' | 'desc') {
    if (config.sort.col === col) {
      onChange({
        ...config,
        sort: { col, dir: config.sort.dir === 'asc' ? 'desc' : 'asc' },
      });
    } else {
      onChange({ ...config, sort: { col, dir: defaultDir } });
    }
  }

  return (
    <thead className="bg-gray-50 text-sm">
      <tr>
        <SortableTh
          label="כותרת"
          active={config.sort.col === 'title'}
          dir={config.sort.dir}
          onClick={() => toggleSort('title', 'asc')}
        />

        <th className="relative px-4 py-3 text-right font-medium text-gray-600">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1"
              onClick={() => toggleSort('sources', 'asc')}
              title="סדר לפי index של המקור הנמוך ביותר"
            >
              <span>מקורות</span>
              <SortIndicator active={config.sort.col === 'sources'} dir={config.sort.dir} />
            </button>
            <button
              type="button"
              className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-200"
              onClick={() => setOpen(open === 'books' ? null : 'books')}
              title="סנן לפי ספר"
            >
              🔍
              <FilterBadge count={config.filters.books.length} />
            </button>
          </div>
          <BookFilterPopover
            open={open === 'books'}
            onClose={() => setOpen(null)}
            selected={config.filters.books}
            onChange={(books) => onChange({ ...config, filters: { ...config.filters, books } })}
          />
        </th>

        <th className="relative px-4 py-3 text-right font-medium text-gray-600">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1"
              onClick={() => toggleSort('topics', 'desc')}
              title="סדר לפי כמות נושאים"
            >
              <span>נושאים</span>
              <SortIndicator active={config.sort.col === 'topics'} dir={config.sort.dir} />
            </button>
            <button
              type="button"
              className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-200"
              onClick={() => setOpen(open === 'topics' ? null : 'topics')}
              title="סנן לפי נושא"
            >
              🔍
              <FilterBadge count={config.filters.topics.length} />
            </button>
          </div>
          <TagFilterPopover
            apiUrl="/api/topics"
            placeholder="חפש נושא..."
            open={open === 'topics'}
            onClose={() => setOpen(null)}
            selected={config.filters.topics}
            onChange={(topics: TagRef[]) =>
              onChange({ ...config, filters: { ...config.filters, topics } })
            }
          />
        </th>

        <th className="relative px-4 py-3 text-right font-medium text-gray-600">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1"
              onClick={() => toggleSort('sages', 'desc')}
              title="סדר לפי כמות חכמים"
            >
              <span>חכמים</span>
              <SortIndicator active={config.sort.col === 'sages'} dir={config.sort.dir} />
            </button>
            <button
              type="button"
              className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-200"
              onClick={() => setOpen(open === 'sages' ? null : 'sages')}
              title="סנן לפי חכם"
            >
              🔍
              <FilterBadge count={config.filters.sages.length} />
            </button>
          </div>
          <TagFilterPopover
            apiUrl="/api/sages"
            placeholder="חפש חכם..."
            open={open === 'sages'}
            onClose={() => setOpen(null)}
            selected={config.filters.sages}
            onChange={(sages: TagRef[]) =>
              onChange({ ...config, filters: { ...config.filters, sages } })
            }
          />
        </th>

        <SortableTh
          label="זמן שינוי אחרון"
          active={config.sort.col === 'updatedAt'}
          dir={config.sort.dir}
          onClick={() => toggleSort('updatedAt', 'desc')}
        />
      </tr>
    </thead>
  );
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 text-right font-medium text-gray-600">
      <button type="button" className="flex items-center gap-1" onClick={onClick}>
        <span>{label}</span>
        <SortIndicator active={active} dir={dir} />
      </button>
    </th>
  );
}
