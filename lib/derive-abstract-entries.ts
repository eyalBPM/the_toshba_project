import type { SnapshotTag } from '@/ui/hooks/use-editor-state';

interface TipTapNode {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
}

function collectInlineIds(content: unknown, nodeType: string, idAttr: string): Set<string> {
  const ids = new Set<string>();
  function walk(node: TipTapNode | unknown) {
    if (!node || typeof node !== 'object') return;
    const n = node as TipTapNode;
    if (n.type === nodeType) {
      const val = n.attrs?.[idAttr];
      if (typeof val === 'string') ids.add(val);
    }
    if (Array.isArray(n.content)) n.content.forEach(walk);
  }
  walk(content);
  return ids;
}

export interface ReferenceSnapshotEntry {
  articleId: string;
  slug: string;
  title: string;
}

export interface SourceSnapshotEntry {
  id: string;
  label: string;
  // Denormalized at write time from the Source table. Used by the /articles
  // list to sort by Source.index and filter by Source.book without joining.
  // Optional because pre-2026-05-20 snapshots predate the denormalization
  // and have not been backfilled yet (see scripts/backfill-source-snapshots).
  book?: string;
  index?: number;
}

export function deriveAbstractTopics(
  topicsSnapshot: unknown,
  content: unknown,
): SnapshotTag[] {
  if (!Array.isArray(topicsSnapshot)) return [];
  const bodyIds = collectInlineIds(content, 'topicMark', 'topicId');
  return (topicsSnapshot as SnapshotTag[]).filter((t) => t && t.id && !bodyIds.has(t.id));
}

export function deriveAbstractSages(
  sagesSnapshot: unknown,
  content: unknown,
): SnapshotTag[] {
  if (!Array.isArray(sagesSnapshot)) return [];
  const bodyIds = collectInlineIds(content, 'sageMark', 'sageId');
  return (sagesSnapshot as SnapshotTag[]).filter((s) => s && s.id && !bodyIds.has(s.id));
}

export function deriveAbstractSources(
  sourcesSnapshot: unknown,
  content: unknown,
): SnapshotTag[] {
  if (!Array.isArray(sourcesSnapshot)) return [];
  const bodyIds = collectInlineIds(content, 'sourceCitation', 'sourceId');
  return (sourcesSnapshot as SourceSnapshotEntry[])
    .filter((s) => s && s.id && !bodyIds.has(s.id))
    .map((s) => ({ id: s.id, text: s.label }));
}

export function deriveAbstractReferences(
  referencesSnapshot: unknown,
  content: unknown,
): ReferenceSnapshotEntry[] {
  if (!Array.isArray(referencesSnapshot)) return [];
  const bodyIds = collectInlineIds(content, 'referenceMark', 'articleId');
  return (referencesSnapshot as ReferenceSnapshotEntry[]).filter(
    (r) => r && r.articleId && !bodyIds.has(r.articleId),
  );
}

export function deriveBodyTopics(
  topicsSnapshot: unknown,
  content: unknown,
): SnapshotTag[] {
  if (!Array.isArray(topicsSnapshot)) return [];
  const bodyIds = collectInlineIds(content, 'topicMark', 'topicId');
  return (topicsSnapshot as SnapshotTag[]).filter((t) => t && t.id && bodyIds.has(t.id));
}

export function deriveBodySages(
  sagesSnapshot: unknown,
  content: unknown,
): SnapshotTag[] {
  if (!Array.isArray(sagesSnapshot)) return [];
  const bodyIds = collectInlineIds(content, 'sageMark', 'sageId');
  return (sagesSnapshot as SnapshotTag[]).filter((s) => s && s.id && bodyIds.has(s.id));
}

export function deriveBodySources(
  sourcesSnapshot: unknown,
  content: unknown,
): SourceSnapshotEntry[] {
  if (!Array.isArray(sourcesSnapshot)) return [];
  const bodyIds = collectInlineIds(content, 'sourceCitation', 'sourceId');
  return (sourcesSnapshot as SourceSnapshotEntry[]).filter(
    (s) => s && s.id && bodyIds.has(s.id),
  );
}

export function deriveBodyReferences(
  referencesSnapshot: unknown,
  content: unknown,
): ReferenceSnapshotEntry[] {
  if (!Array.isArray(referencesSnapshot)) return [];
  const bodyIds = collectInlineIds(content, 'referenceMark', 'articleId');
  return (referencesSnapshot as ReferenceSnapshotEntry[]).filter(
    (r) => r && r.articleId && bodyIds.has(r.articleId),
  );
}

/**
 * Returns the set of real (non-"missing") sourceIds cited in a content tree.
 * Used by callers that need to fetch just the cited sources from the DB
 * (instead of pulling the full sources table).
 */
export function collectCitedSourceIds(content: unknown): string[] {
  const ids = collectInlineIds(content, 'sourceCitation', 'sourceId');
  ids.delete('missing');
  return Array.from(ids);
}

export interface SourceLookupRow {
  label: string;
  book: string;
  index: number;
}

/**
 * Builds a snapshot purely from a TipTap content tree. Used for entities
 * that don't persist snapshot fields of their own (currently: opinion
 * responses) — the sidebar derives entries from whatever the body contains.
 * Source labels/book/index require a DB lookup, so the caller passes a map.
 */
export function buildSnapshotFromContent(
  content: unknown,
  sourcesById: Map<string, SourceLookupRow>,
): {
  topicsSnapshot: SnapshotTag[];
  sagesSnapshot: SnapshotTag[];
  sourcesSnapshot: SourceSnapshotEntry[];
  referencesSnapshot: ReferenceSnapshotEntry[];
} {
  const topics = new Map<string, SnapshotTag>();
  const sages = new Map<string, SnapshotTag>();
  const sources = new Map<string, SourceSnapshotEntry>();
  const refs = new Map<string, ReferenceSnapshotEntry>();

  function walk(node: TipTapNode | unknown) {
    if (!node || typeof node !== 'object') return;
    const n = node as TipTapNode;
    const attrs = n.attrs ?? {};
    if (n.type === 'topicMark') {
      const id = attrs.topicId as string | undefined;
      if (id) topics.set(id, { id, text: (attrs.topicText as string) ?? '' });
    } else if (n.type === 'sageMark') {
      const id = attrs.sageId as string | undefined;
      if (id) sages.set(id, { id, text: (attrs.sageText as string) ?? '' });
    } else if (n.type === 'referenceMark') {
      const articleId = attrs.articleId as string | undefined;
      if (articleId && !refs.has(articleId)) {
        refs.set(articleId, {
          articleId,
          slug: (attrs.articleSlug as string) ?? '',
          title: (attrs.articleTitle as string) ?? '',
        });
      }
    } else if (n.type === 'sourceCitation') {
      const id = attrs.sourceId as string | undefined;
      if (id && id !== 'missing' && !sources.has(id)) {
        const row = sourcesById.get(id);
        if (row !== undefined) {
          sources.set(id, { id, label: row.label, book: row.book, index: row.index });
        }
      }
    }
    if (Array.isArray(n.content)) n.content.forEach(walk);
  }
  walk(content);

  return {
    topicsSnapshot: Array.from(topics.values()),
    sagesSnapshot: Array.from(sages.values()),
    sourcesSnapshot: Array.from(sources.values()),
    referencesSnapshot: Array.from(refs.values()),
  };
}

/**
 * Returns a Map<sourceId, number> mirroring `getCitationNumbers` semantics
 * (first occurrence wins; missing-source citations are excluded since they
 * have no stable id). Used by read-only view pages to label body sources in
 * the sidebar consistently with the inline [n] badges.
 */
export function deriveSourceNumbers(content: unknown): Map<string, number> {
  const result = new Map<string, number>();
  let next = 1;
  function walk(node: TipTapNode | unknown) {
    if (!node || typeof node !== 'object') return;
    const n = node as TipTapNode;
    if (n.type === 'sourceCitation') {
      const sourceId = n.attrs?.sourceId;
      if (typeof sourceId === 'string' && sourceId !== 'missing' && !result.has(sourceId)) {
        result.set(sourceId, next++);
      }
    }
    if (Array.isArray(n.content)) n.content.forEach(walk);
  }
  walk(content);
  return result;
}
