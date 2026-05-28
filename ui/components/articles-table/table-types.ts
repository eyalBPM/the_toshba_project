export interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  minSourceIndex: number | null;
  snapshot: {
    sourcesSnapshot: unknown;
    topicsSnapshot: unknown;
    sagesSnapshot: unknown;
  } | null;
}
