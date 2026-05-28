'use client';

import { useMemo, useState } from 'react';
import { useBooksList } from '@/ui/hooks/use-books-list';
import { FilterPopoverShell } from './filter-popover-shell';

interface Props {
  selected: string[];
  open: boolean;
  onClose: () => void;
  onChange: (next: string[]) => void;
}

export function BookFilterPopover({ selected, open, onClose, onChange }: Props) {
  const books = useBooksList();
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const term = search.trim();
    if (!term) return books;
    return books.filter((b) => b.includes(term));
  }, [books, search]);

  function toggle(book: string) {
    if (selected.includes(book)) onChange(selected.filter((b) => b !== book));
    else onChange([...selected, book]);
  }

  return (
    <FilterPopoverShell open={open} onClose={onClose}>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="חפש ספר..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex justify-between text-xs">
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => onChange(filtered)}
          >
            סמן הכל
          </button>
          <button
            type="button"
            className="text-gray-600 hover:underline"
            onClick={() => onChange([])}
          >
            נקה
          </button>
        </div>
        <div className="max-h-56 overflow-y-auto rounded border border-gray-100">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-xs text-gray-500">אין ספרים</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {filtered.map((book) => (
                <li key={book}>
                  <label className="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selected.includes(book)}
                      onChange={() => toggle(book)}
                    />
                    <span>{book}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </FilterPopoverShell>
  );
}
