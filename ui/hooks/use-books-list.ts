'use client';

import { useEffect, useState } from 'react';

// Module-level cache so the book list is fetched once per page lifecycle.
let cached: string[] | null = null;
const listeners: Array<(books: string[]) => void> = [];

function notifyListeners(books: string[]) {
  listeners.forEach((fn) => fn(books));
}

async function fetchBooks(): Promise<string[]> {
  if (cached) return cached;
  const res = await fetch('/api/sources/books');
  if (!res.ok) return [];
  const json = await res.json();
  const books = (json.data ?? []) as string[];
  cached = books;
  notifyListeners(books);
  return books;
}

export function useBooksList(): string[] {
  const [books, setBooks] = useState<string[]>(cached ?? []);

  useEffect(() => {
    if (cached) {
      setBooks(cached);
      return;
    }
    const handler = (b: string[]) => setBooks(b);
    listeners.push(handler);
    fetchBooks().catch(() => {});
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  return books;
}
