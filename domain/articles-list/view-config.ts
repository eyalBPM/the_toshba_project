import { z } from 'zod';

export const SORT_COLUMNS = ['title', 'sources', 'topics', 'sages', 'updatedAt'] as const;
export type SortCol = (typeof SORT_COLUMNS)[number];

export const SORT_DIRS = ['asc', 'desc'] as const;
export type SortDir = (typeof SORT_DIRS)[number];

const tagRefSchema = z.object({ id: z.string().min(1), text: z.string() });
export type TagRef = z.infer<typeof tagRefSchema>;

export const articlesViewConfigSchema = z.object({
  sort: z
    .object({
      col: z.enum(SORT_COLUMNS).default('updatedAt'),
      dir: z.enum(SORT_DIRS).default('desc'),
    })
    .default({ col: 'updatedAt', dir: 'desc' }),
  filters: z
    .object({
      books: z.array(z.string().min(1)).default([]),
      // Topic / sage selections store both id and a snapshot of the text at
      // selection time so the UI can render chips without an extra fetch.
      // Server-side filtering ignores .text and matches on .id only.
      topics: z.array(tagRefSchema).default([]),
      sages: z.array(tagRefSchema).default([]),
    })
    .default({ books: [], topics: [], sages: [] }),
  search: z
    .object({
      text: z.string().default(''),
      includeContent: z.boolean().default(false),
    })
    .default({ text: '', includeContent: false }),
});

export type ArticlesViewConfig = z.infer<typeof articlesViewConfigSchema>;

export const DEFAULT_ARTICLES_VIEW_CONFIG: ArticlesViewConfig = {
  sort: { col: 'updatedAt', dir: 'desc' },
  filters: { books: [], topics: [], sages: [] },
  search: { text: '', includeContent: false },
};

export const TABLE_VIEW_SCOPE_ARTICLES = 'articles';
